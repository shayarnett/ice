import { join } from "path";
import { readFile } from "fs/promises";
import type {
  IceConfig,
  Page,
  PostPage,
  DiscoveredFile,
  Collection,
  SiteContext,
  HookContext,
  Paginator,
} from "../types";
import { HookSystem } from "../plugins/hooks";
import { PluginAPI } from "../plugins/api";
import { loadPlugins } from "../plugins/loader";
import feedPlugin from "../plugins/builtin/feed";
import taxonomyPagesPlugin from "../plugins/builtin/taxonomy-pages";
import { discoverFiles } from "./discovery";
import { parseFrontmatter } from "./frontmatter";
import { renderPage, resolvePermalink, type RenderDeps, type RenderContext } from "./renderer";
import { writePages, writeNoJekyll, resolveOutputPath, cleanOutput } from "./writer";
import { BuildCache, computeHash } from "./cache";

export type BuildStage =
  | "INIT"
  | "DISCOVER"
  | "CLASSIFY"
  | "DATA"
  | "PARSE"
  | "COLLECTIONS"
  | "PAGINATION"
  | "RENDER"
  | "FEEDS"
  | "ASSETS"
  | "WRITE"
  | "DONE";

export interface BuildOptions {
  incremental?: boolean;
  drafts?: boolean;
  profile?: boolean;
}

export interface BuildResult {
  pages: Page[];
  elapsed: number;
  stage: BuildStage;
}

/**
 * The core build engine. Coordinates the full build pipeline.
 */
export class Engine {
  private hooks = new HookSystem();
  private cache: BuildCache;
  private config: IceConfig;
  private pages: Page[] = [];
  private posts: PostPage[] = [];
  private collections: Record<string, Collection> = {};
  private siteData: Record<string, unknown> = {};
  private globalData: Record<string, unknown> = {};
  private pluginPages: Partial<Page>[] = [];
  private paginatorMap = new Map<string, Paginator>();

  private pluginAPI: PluginAPI;
  private pluginsLoaded = false;

  constructor(config: IceConfig) {
    this.config = config;
    this.cache = new BuildCache(config);
    this.pluginAPI = new PluginAPI(this.hooks, config);
  }

  /**
   * Load built-in and user plugins. Called once before the first build.
   */
  private async loadPlugins(): Promise<void> {
    if (this.pluginsLoaded) return;
    this.pluginsLoaded = true;

    // Built-in plugins
    await feedPlugin.setup(this.pluginAPI);
    await taxonomyPagesPlugin.setup(this.pluginAPI);

    // User plugins from config + _plugins/
    await loadPlugins(this.config, this.pluginAPI);

    // Apply plugin global data contributions
    for (const [key, value] of this.pluginAPI.getGlobalData()) {
      this.globalData[key] = value;
    }
  }

  getHooks(): HookSystem {
    return this.hooks;
  }

  addPluginPage(page: Partial<Page>): void {
    this.pluginPages.push(page);
  }

  addGlobalData(key: string, value: unknown): void {
    this.globalData[key] = value;
  }

  /**
   * Run the full build pipeline.
   */
  async build(options: BuildOptions = {}): Promise<BuildResult> {
    const startTime = performance.now();
    const profile = options.profile ?? false;
    const stageTimer = (label: string) => {
      if (!profile) return () => {};
      const s = performance.now();
      return () => console.log(`  [${label}] ${(performance.now() - s).toFixed(1)}ms`);
    };

    // ── INIT ──
    let done = stageTimer("INIT");
    await this.loadPlugins();
    if (options.incremental) {
      await this.cache.load();
    } else {
      await cleanOutput(this.config);
    }
    await this.hooks.emit("beforeBuild", this.hookContext());
    done();

    // ── DISCOVER ──
    done = stageTimer("DISCOVER");
    const discoveredFiles = await discoverFiles(this.config);
    done();

    // ── CLASSIFY ──
    done = stageTimer("CLASSIFY");
    const pageFiles: DiscoveredFile[] = [];
    const postFiles: DiscoveredFile[] = [];
    const dataFiles: DiscoveredFile[] = [];
    const layoutFiles: DiscoveredFile[] = [];
    const includeFiles: DiscoveredFile[] = [];
    const assetFiles: DiscoveredFile[] = [];
    const collectionFiles = new Map<string, DiscoveredFile[]>();

    for (const file of discoveredFiles) {
      switch (file.type) {
        case "page":
          pageFiles.push(file);
          break;
        case "post":
          postFiles.push(file);
          break;
        case "data":
          dataFiles.push(file);
          break;
        case "layout":
          layoutFiles.push(file);
          break;
        case "include":
          includeFiles.push(file);
          break;
        case "asset":
          assetFiles.push(file);
          break;
        case "collection": {
          const name = file.collectionName ?? "unknown";
          const list = collectionFiles.get(name) ?? [];
          list.push(file);
          collectionFiles.set(name, list);
          break;
        }
      }
    }
    done();

    // ── DATA ──
    done = stageTimer("DATA");
    this.siteData = {};
    try {
      const { loadData } = await import("../data/loader");
      this.siteData = await loadData(join(this.config.root, "_data"));
    } catch {
      // Data loader module may not exist yet
    }
    // Merge plugin-provided global data
    Object.assign(this.siteData, this.globalData);
    done();

    // ── PARSE ──
    done = stageTimer("PARSE");
    this.pages = [];
    this.posts = [];

    // Parse regular pages (use file-path-based URLs, not blog permalink pattern)
    for (const file of pageFiles) {
      const page = await this.parseFile(file, null);
      if (!page) continue;
      if (!options.drafts && page.data.draft) continue;
      this.pages.push(page);
    }

    // Parse posts (with date extraction from filename)
    for (const file of postFiles) {
      const post = await this.parsePost(file);
      if (!post) continue;
      if (!options.drafts && post.data.draft) continue;
      this.posts.push(post);
    }

    // Parse collection files
    for (const [name, files] of collectionFiles) {
      const colConfig = this.config.collections[name];
      if (!colConfig) continue;
      const colPages: Page[] = [];
      for (const file of files) {
        const page = await this.parseFile(file, colConfig.permalink);
        if (!page) continue;
        if (!options.drafts && page.data.draft) continue;
        colPages.push(page);
      }
      if (colConfig.sort) {
        colPages.sort((a, b) => {
          const aVal = a.data[colConfig.sort!];
          const bVal = b.data[colConfig.sort!];
          if (aVal instanceof Date && bVal instanceof Date) return aVal.getTime() - bVal.getTime();
          return String(aVal ?? "").localeCompare(String(bVal ?? ""));
        });
      }
      this.collections[name] = { name, config: colConfig, pages: colPages };
    }

    // Sort posts by date descending
    this.posts.sort((a, b) => {
      const dateA = a.data.date?.getTime() ?? 0;
      const dateB = b.data.date?.getTime() ?? 0;
      return dateB - dateA;
    });

    // Link previous/next on posts
    for (let i = 0; i < this.posts.length; i++) {
      if (i > 0) this.posts[i].previous = this.posts[i - 1];
      if (i < this.posts.length - 1) this.posts[i].next = this.posts[i + 1];
    }

    await this.hooks.emit("afterDiscover", this.hookContext());

    // Collect all plugin-injected pages (from setup and from hooks like afterDiscover)
    for (const partial of this.pluginAPI.getInjectedPages()) {
      const page: Page = {
        sourcePath: partial.sourcePath ?? "",
        relativePath: partial.relativePath ?? "",
        url: partial.url ?? "/",
        outputPath: partial.outputPath ?? resolveOutputPath(partial.url ?? "/", this.config),
        rawContent: partial.rawContent ?? "",
        content: partial.content ?? "",
        data: partial.data ?? {},
        contentHash: "",
        layoutChain: [],
        includeDeps: [],
        excerpt: partial.excerpt ?? "",
      };
      this.pages.push(page);
    }
    done();

    // ── COLLECTIONS ──
    done = stageTimer("COLLECTIONS");
    // Build the built-in "posts" collection
    this.collections["posts"] = {
      name: "posts",
      config: { directory: "_posts", permalink: this.config.permalink },
      pages: this.posts,
    };

    // Taxonomy pages are generated by the built-in taxonomy-pages plugin
    // via the afterDiscover hook (already fired above)
    done();

    // ── PAGINATION ──
    done = stageTimer("PAGINATION");
    try {
      const { expandPagination } = await import("../collections/pagination");
      const expandedPages: Page[] = [];
      this.paginatorMap = new Map<string, Paginator>();
      const paginatedSources = new Set<string>();

      for (const page of this.pages) {
        if (page.data.pagination) {
          const colName = page.data.pagination.collection;
          const col = this.collections[colName];
          if (col) {
            const { pages: pPages, paginators } = expandPagination(page, col.pages, this.config);
            expandedPages.push(...pPages);
            paginatedSources.add(page.sourcePath);
            for (let i = 0; i < pPages.length; i++) {
              if (paginators[i]) this.paginatorMap.set(pPages[i].url, paginators[i]);
            }
          }
        }
      }

      // Replace original paginated templates with expanded pages
      this.pages = this.pages.filter((p) => !paginatedSources.has(p.sourcePath));
      this.pages.push(...expandedPages);
    } catch {
      // Pagination module not yet available
    }
    done();

    // ── RENDER ──
    done = stageTimer("RENDER");
    const renderDeps = await this.buildRenderDeps(layoutFiles);
    const site = this.buildSiteContext();

    await this.hooks.emit("beforeRender", this.hookContext());

    // Incremental: determine which pages need re-rendering
    let pagesToRender = [...this.pages, ...this.posts as Page[]];
    if (options.incremental) {
      const changedFiles = new Set<string>();
      for (const page of pagesToRender) {
        const hash = computeHash(page.rawContent);
        if (this.cache.isDirty(page.relativePath, hash)) {
          changedFiles.add(page.relativePath);
        }
      }
      // Add layouts/includes that changed
      for (const file of [...layoutFiles, ...includeFiles]) {
        try {
          const content = await readFile(file.absolutePath, "utf-8");
          const hash = computeHash(content);
          if (this.cache.isDirty(file.relativePath, hash)) {
            changedFiles.add(file.relativePath);
          }
        } catch {
          // File may have been deleted
        }
      }
      const dirtySet = this.cache.computeDirtySet(changedFiles);
      pagesToRender = pagesToRender.filter((p) => dirtySet.has(p.relativePath));
    }

    const rendered: Page[] = [];
    for (const page of pagesToRender) {
      const ctx: RenderContext = {
        site,
        collections: this.collections,
        paginator: this.paginatorMap.get(page.url),
      };
      const result = await renderPage(page, this.config, renderDeps, ctx);
      rendered.push(result);

      // Update cache entry
      if (options.incremental) {
        this.cache.setEntry(page.relativePath, {
          contentHash: computeHash(page.rawContent),
          dependencies: [...result.layoutChain, ...result.includeDeps],
          outputPaths: [result.outputPath],
        });
      }
    }

    await this.hooks.emit("afterRender", this.hookContext());
    done();

    // ── FEEDS ──
    // Feed generation is handled by the built-in feed plugin via the
    // "afterRender" hook emitted above.
    done = stageTimer("FEEDS");
    done();

    // ── ASSETS ──
    done = stageTimer("ASSETS");
    try {
      const { processAssets } = await import("../assets/pipeline");
      await processAssets(this.config, assetFiles);
    } catch {
      // Assets module not yet available
    }
    done();

    // ── WRITE ──
    done = stageTimer("WRITE");
    await this.hooks.emit("beforeWrite", this.hookContext());
    await writePages(rendered, this.config);
    await writeNoJekyll(this.config);
    await this.hooks.emit("afterWrite", this.hookContext());
    done();

    // ── DONE ──
    if (options.incremental) {
      await this.cache.save();
    }

    const elapsed = performance.now() - startTime;
    await this.hooks.emit("afterBuild", this.hookContext());

    if (profile) {
      console.log(`\nBuild complete: ${rendered.length} pages in ${elapsed.toFixed(0)}ms`);
    }

    return {
      pages: rendered,
      elapsed,
      stage: "DONE",
    };
  }

  /**
   * Parse a discovered file into a Page.
   */
  private async parseFile(file: DiscoveredFile, permalinkPattern: string | null): Promise<Page | null> {
    let raw: string;
    try {
      raw = await readFile(file.absolutePath, "utf-8");
    } catch {
      return null;
    }

    const { data, content, excerpt } = parseFrontmatter(raw);

    // Use frontmatter permalink override, or pattern for posts/collections, or file-path URL for pages
    const permalink = (data.permalink as string) ?? permalinkPattern;

    const page: Page = {
      sourcePath: file.absolutePath,
      relativePath: file.relativePath,
      url: "",
      outputPath: "",
      rawContent: content,
      content: "",
      data,
      contentHash: computeHash(raw),
      layoutChain: [],
      includeDeps: [],
      excerpt,
    };

    if (permalink) {
      page.url = resolvePermalink(permalink, page);
    } else {
      // File-path-based URL: about.md → /about/, index.md → /
      page.url = filePathToUrl(file.relativePath);
    }
    page.outputPath = resolveOutputPath(page.url, this.config);

    return page;
  }

  /**
   * Parse a post file. Extracts date and slug from filename pattern: YYYY-MM-DD-slug.md
   */
  private async parsePost(file: DiscoveredFile): Promise<PostPage | null> {
    const page = await this.parseFile(file, this.config.permalink);
    if (!page) return null;

    // Extract date and slug from filename
    const filename = file.relativePath.split("/").pop() ?? "";
    const match = filename.match(/^(\d{4})-(\d{2})-(\d{2})-(.+)\.\w+$/);

    let date = page.data.date;
    let slug = page.data.slug as string | undefined;

    if (match) {
      if (!date) {
        date = new Date(`${match[1]}-${match[2]}-${match[3]}`);
      }
      if (!slug) {
        slug = match[4];
      }
    }

    if (!date) {
      date = new Date();
    }
    if (!slug) {
      slug = filename.replace(/\.\w+$/, "");
    }

    const post = page as PostPage;
    post.data.date = date instanceof Date ? date : new Date(date as string);
    post.data.slug = slug;

    // Re-resolve permalink with post data
    const permalink = (post.data.permalink as string) ?? this.config.permalink;
    post.url = resolvePermalink(permalink, post);
    post.outputPath = resolveOutputPath(post.url, this.config);

    return post;
  }

  /**
   * Build render dependencies (markdown engine, template engine, layout reader).
   */
  private async buildRenderDeps(layoutFiles: DiscoveredFile[]): Promise<RenderDeps> {
    // Build layout map
    const layouts = new Map<string, { content: string; data: Record<string, unknown> }>();
    for (const file of layoutFiles) {
      try {
        const raw = await readFile(file.absolutePath, "utf-8");
        const parsed = parseFrontmatter(raw);
        const name = file.relativePath
          .replace(/^_layouts\//, "")
          .replace(/\.\w+$/, "");
        layouts.set(name, { content: parsed.content, data: parsed.data });
      } catch {
        // Skip unreadable layouts
      }
    }

    // Try to import markdown engine
    let renderMarkdown: (content: string) => string;
    try {
      const { MarkdownEngine } = await import("../markdown/index");
      const mdEngine = new MarkdownEngine(this.config);
      renderMarkdown = (content: string) => mdEngine.render(content);
    } catch {
      // Fallback: return content as-is
      renderMarkdown = (content: string) => content;
    }

    // Try to import template engine
    let renderTemplate: (template: string, context: Record<string, unknown>) => Promise<string>;
    try {
      const { TemplateEngine } = await import("../template/engine");
      const tmplEngine = new TemplateEngine(this.config);
      await tmplEngine.loadTemplates();
      renderTemplate = (template: string, context: Record<string, unknown>) =>
        tmplEngine.render(template, context as any);
    } catch (err) {
      // Fallback: return template as-is
      console.error("[ice] Template engine failed to load:", err);
      renderTemplate = async (template: string) => template;
    }

    return {
      renderMarkdown,
      renderTemplate,
      readLayout: async (name: string) => layouts.get(name) ?? null,
    };
  }

  /**
   * Build the site-wide context for templates.
   */
  private buildSiteContext(): SiteContext {
    // Build taxonomy maps
    const tags: Record<string, Page[]> = {};
    const categories: Record<string, Page[]> = {};

    for (const post of this.posts) {
      if (post.data.tags) {
        for (const tag of post.data.tags) {
          (tags[tag] ??= []).push(post);
        }
      }
      if (post.data.categories) {
        for (const cat of post.data.categories) {
          (categories[cat] ??= []).push(post);
        }
      }
    }

    return {
      title: this.config.title,
      url: this.config.url,
      baseUrl: this.config.baseUrl,
      time: new Date(),
      pages: this.pages,
      posts: this.posts,
      tags,
      categories,
      collections: this.collections,
      data: this.siteData,
    };
  }

  /**
   * Build a hook context for plugin lifecycle events.
   */
  private hookContext(): HookContext {
    return {
      config: this.config,
      pages: [...this.pages, ...this.posts],
      site: this.buildSiteContext(),
    };
  }
}

/**
 * Convert a file path to a URL path.
 * about.md → /about/
 * index.md → /
 * docs/guide.md → /docs/guide/
 */
function filePathToUrl(relativePath: string): string {
  let url = "/" + relativePath
    .replace(/\.(md|markdown|html|liquid)$/, "")
    .replace(/\/index$/, "")
    .replace(/^index$/, "");

  if (url !== "/" && !url.endsWith("/")) {
    url += "/";
  }

  return url;
}
