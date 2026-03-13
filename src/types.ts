// ── Config ──────────────────────────────────────────────────────────

export interface IceConfig {
  title: string;
  url: string;
  baseUrl: string;
  permalink: string;

  collections: Record<string, CollectionConfig>;
  taxonomies: Record<string, TaxonomyConfig>;

  pagination: { perPage: number };

  markdown: {
    linkify?: boolean;
    typographer?: boolean;
    highlight?: { theme: string };
  };

  assets: {
    fingerprint?: boolean;
    minify?: boolean;
  };

  feeds: Record<string, FeedConfig>;

  serve: {
    port: number;
    livereload?: boolean;
  };

  plugins: string[];

  /** Internal: resolved root directory of the site */
  root: string;
  /** Internal: output directory */
  outDir: string;
  /** Internal: cache directory */
  cacheDir: string;
}

export interface CollectionConfig {
  directory: string;
  permalink: string;
  sort?: string;
}

export interface TaxonomyConfig {
  permalink: string;
}

export interface FeedConfig {
  path: string;
  collection: string;
  limit?: number;
}

// ── Pages & Content ─────────────────────────────────────────────────

export interface Page {
  /** Absolute source path */
  sourcePath: string;
  /** Relative source path from site root */
  relativePath: string;
  /** Output URL path */
  url: string;
  /** Output file path (absolute) */
  outputPath: string;
  /** Raw source content (without frontmatter) */
  rawContent: string;
  /** Rendered HTML content */
  content: string;
  /** Parsed frontmatter data */
  data: PageData;
  /** Content hash for incremental builds */
  contentHash: string;
  /** Layout dependency chain */
  layoutChain: string[];
  /** Include dependencies */
  includeDeps: string[];
  /** Excerpt (first paragraph or explicit) */
  excerpt: string;
}

export interface PageData {
  title?: string;
  layout?: string;
  date?: Date;
  draft?: boolean;
  tags?: string[];
  categories?: string[];
  permalink?: string;
  pagination?: PaginationFrontmatter;
  [key: string]: unknown;
}

export interface PaginationFrontmatter {
  collection: string;
  perPage?: number;
}

// ── Collections ─────────────────────────────────────────────────────

export interface Collection {
  name: string;
  config: CollectionConfig;
  pages: Page[];
}

export interface PostPage extends Page {
  data: PageData & {
    date: Date;
    slug: string;
  };
  previous?: PostPage;
  next?: PostPage;
}

// ── Pagination ──────────────────────────────────────────────────────

export interface Paginator {
  items: Page[];
  page: number;
  totalPages: number;
  totalItems: number;
  perPage: number;
  previousUrl: string | null;
  nextUrl: string | null;
  firstUrl: string;
  lastUrl: string;
}

// ── Template Context ────────────────────────────────────────────────

export interface SiteContext {
  title: string;
  url: string;
  baseUrl: string;
  time: Date;
  pages: Page[];
  posts: PostPage[];
  tags: Record<string, Page[]>;
  categories: Record<string, Page[]>;
  collections: Record<string, Collection>;
  data: Record<string, unknown>;
}

export interface TemplateContext {
  site: SiteContext;
  page: Page;
  content: string;
  collections: Record<string, Collection>;
  paginator?: Paginator;
}

// ── Plugin System ───────────────────────────────────────────────────

export type HookName =
  | "beforeBuild"
  | "afterDiscover"
  | "beforeRender"
  | "afterRender"
  | "beforeWrite"
  | "afterWrite"
  | "afterBuild"
  | "beforeServe";

export interface IcePlugin {
  name: string;
  setup(api: IcePluginAPI): void | Promise<void>;
}

export interface IcePluginAPI {
  on(event: HookName, fn: HookCallback): void;
  addFilter(name: string, fn: (...args: unknown[]) => unknown): void;
  addTag(name: string, tag: unknown): void;
  addPage(page: Partial<Page>): void;
  addGlobalData(key: string, value: unknown): void;
  getConfig(): IceConfig;
}

export type HookCallback = (context: HookContext) => void | Promise<void>;

export interface HookContext {
  config: IceConfig;
  pages: Page[];
  site: SiteContext;
}

// ── Assets ──────────────────────────────────────────────────────────

export interface AssetManifest {
  [originalPath: string]: string; // maps original → fingerprinted path
}

// ── Cache ───────────────────────────────────────────────────────────

export interface CacheEntry {
  contentHash: string;
  dependencies: string[];
  outputPaths: string[];
}

export interface CacheManifest {
  version: number;
  entries: Record<string, CacheEntry>;
}

// ── Discovery ───────────────────────────────────────────────────────

export type FileType = "page" | "post" | "collection" | "data" | "asset" | "layout" | "include" | "ignore";

export interface DiscoveredFile {
  absolutePath: string;
  relativePath: string;
  type: FileType;
  collectionName?: string;
}
