import type { Page, Paginator, IceConfig } from "../types";
import { posix } from "path";

export function expandPagination(
  page: Page,
  collection: Page[],
  config: IceConfig,
): { pages: Page[]; paginators: Paginator[] } {
  const paginationMeta = page.data.pagination;
  if (!paginationMeta) {
    return { pages: [page], paginators: [] };
  }

  const perPage = paginationMeta.perPage ?? config.pagination.perPage;
  const totalItems = collection.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));

  const baseUrl = page.url.replace(/index\.html$/, "").replace(/\/$/, "") || "/";

  const pages: Page[] = [];
  const paginators: Paginator[] = [];

  for (let i = 0; i < totalPages; i++) {
    const pageNum = i + 1;
    const start = i * perPage;
    const items = collection.slice(start, start + perPage);

    const url = pageNum === 1 ? ensureTrailing(baseUrl) : ensureTrailing(`${baseUrl}/page/${pageNum}`);
    const firstUrl = ensureTrailing(baseUrl);
    const lastUrl =
      totalPages === 1
        ? ensureTrailing(baseUrl)
        : ensureTrailing(`${baseUrl}/page/${totalPages}`);

    const previousUrl =
      pageNum === 1
        ? null
        : pageNum === 2
          ? ensureTrailing(baseUrl)
          : ensureTrailing(`${baseUrl}/page/${pageNum - 1}`);
    const nextUrl =
      pageNum === totalPages ? null : ensureTrailing(`${baseUrl}/page/${pageNum + 1}`);

    const paginator: Paginator = {
      items,
      page: pageNum,
      totalPages,
      totalItems,
      perPage,
      previousUrl,
      nextUrl,
      firstUrl,
      lastUrl,
    };

    const outputPath =
      pageNum === 1
        ? page.outputPath
        : posix.join(
            posix.dirname(page.outputPath),
            `page/${pageNum}/index.html`,
          );

    const paginatedPage: Page = {
      ...page,
      url,
      outputPath,
      data: { ...page.data },
    };

    pages.push(paginatedPage);
    paginators.push(paginator);
  }

  return { pages, paginators };
}

function ensureTrailing(url: string): string {
  return url.endsWith("/") ? url : `${url}/`;
}
