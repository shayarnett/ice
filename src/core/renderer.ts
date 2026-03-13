import type { Page, IceConfig, SiteContext, Collection, Paginator } from "../types";

export interface RenderDeps {
  /** Render Markdown string → HTML string */
  renderMarkdown(content: string): string;
  /** Render Liquid/Droplet template string with context → HTML string */
  renderTemplate(template: string, context: Record<string, unknown>): Promise<string>;
  /** Read a layout file and return its { content, data } */
  readLayout(name: string): Promise<{ content: string; data: Record<string, unknown> } | null>;
}

export interface RenderContext {
  site: SiteContext;
  collections: Record<string, Collection>;
  paginator?: Paginator;
}

/**
 * Render a single page through the full pipeline:
 * 1. Markdown → HTML (if .md source)
 * 2. Liquid/Droplet template rendering
 * 3. Layout chain application
 */
export async function renderPage(
  page: Page,
  config: IceConfig,
  deps: RenderDeps,
  ctx: RenderContext,
): Promise<Page> {
  let content = page.rawContent;
  const isMarkdown = page.sourcePath.endsWith(".md") || page.sourcePath.endsWith(".markdown");

  // Step 1: Render Markdown to HTML
  if (isMarkdown) {
    content = deps.renderMarkdown(content);
  }

  // Step 2: Render through Liquid/Droplet template engine
  const templateContext = buildTemplateContext(page, content, ctx);
  content = await deps.renderTemplate(content, templateContext);

  // Step 3: Apply layout chain
  const layoutChain: string[] = [];
  const includeDeps: string[] = []; // TODO: track include deps from template engine
  let layoutName = page.data.layout;

  while (layoutName) {
    layoutChain.push(layoutName);
    const layout = await deps.readLayout(layoutName);
    if (!layout) break;

    // Render the layout template with the current content
    const layoutContext = buildTemplateContext(page, content, ctx);
    layoutContext.content = content;
    content = await deps.renderTemplate(layout.content, layoutContext);

    // Chain to parent layout if specified
    layoutName = layout.data.layout as string | undefined;
  }

  return {
    ...page,
    content,
    layoutChain,
    includeDeps,
  };
}

/**
 * Build a template context object for rendering.
 */
function buildTemplateContext(
  page: Page,
  content: string,
  ctx: RenderContext,
): Record<string, unknown> {
  return {
    site: ctx.site,
    page: {
      ...page.data,
      url: page.url,
      content,
      excerpt: page.excerpt,
      relativePath: page.relativePath,
    },
    content,
    collections: ctx.collections,
    paginator: ctx.paginator,
  };
}

/**
 * Resolve a permalink pattern using page data.
 * Supports :year, :month, :day, :slug, :title, :categories
 */
export function resolvePermalink(pattern: string, page: Page): string {
  const data = page.data;
  const date = data.date ? new Date(data.date as unknown as string | number) : new Date();

  const slug = (data.slug as string) ?? slugify(data.title ?? fileNameSlug(page.relativePath));
  const title = slugify(data.title ?? slug);
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  const categories =
    Array.isArray(data.categories) && data.categories.length > 0
      ? (data.categories[0] as string)
      : "";

  let url = pattern
    .replace(/:year/g, year)
    .replace(/:month/g, month)
    .replace(/:day/g, day)
    .replace(/:slug/g, slug)
    .replace(/:title/g, title)
    .replace(/:categories/g, categories);

  // Clean up double slashes
  url = url.replace(/\/+/g, "/");

  // Ensure leading slash
  if (!url.startsWith("/")) url = "/" + url;

  return url;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function fileNameSlug(relativePath: string): string {
  const name = relativePath.split(/[/\\]/).pop() ?? "";
  // Strip date prefix like 2024-01-15-
  const withoutDate = name.replace(/^\d{4}-\d{2}-\d{2}-/, "");
  // Strip extension
  const withoutExt = withoutDate.replace(/\.[^.]+$/, "");
  return withoutExt;
}
