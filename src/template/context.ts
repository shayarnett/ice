import type { Page, SiteContext, Collection, Paginator, TemplateContext } from "../types";

export function buildContext(
  page: Page,
  site: SiteContext,
  collections: Record<string, Collection>,
  paginator?: Paginator,
): TemplateContext {
  const ctx: TemplateContext = {
    site,
    page,
    content: page.content,
    collections,
  };

  if (paginator) {
    ctx.paginator = paginator;
  }

  return ctx;
}
