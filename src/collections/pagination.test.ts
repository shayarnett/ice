import { describe, expect, test } from "bun:test";
import { expandPagination } from "./pagination";
import type { Page, IceConfig } from "../types";

function makePage(
  url: string,
  outputPath: string,
  pagination?: { collection: string; perPage?: number },
): Page {
  return {
    sourcePath: "",
    relativePath: "",
    url,
    outputPath,
    rawContent: "",
    content: "",
    data: pagination ? { pagination } : {},
    contentHash: "",
    layoutChain: [],
    includeDeps: [],
    excerpt: "",
  };
}

function makeItems(n: number): Page[] {
  return Array.from({ length: n }, (_, i) =>
    makePage(`/item-${i + 1}/`, `item-${i + 1}/index.html`),
  );
}

const config = { pagination: { perPage: 3 } } as IceConfig;

describe("expandPagination", () => {
  test("returns single page when no pagination meta", () => {
    const page = makePage("/blog/", "blog/index.html");
    const result = expandPagination(page, [], config);
    expect(result.pages).toHaveLength(1);
    expect(result.paginators).toHaveLength(0);
  });

  test("single page when items fit within perPage", () => {
    const page = makePage("/blog/", "blog/index.html", { collection: "posts" });
    const items = makeItems(2);
    const result = expandPagination(page, items, config);

    expect(result.pages).toHaveLength(1);
    expect(result.paginators).toHaveLength(1);
    expect(result.paginators[0].page).toBe(1);
    expect(result.paginators[0].totalPages).toBe(1);
    expect(result.paginators[0].items).toHaveLength(2);
    expect(result.paginators[0].previousUrl).toBeNull();
    expect(result.paginators[0].nextUrl).toBeNull();
  });

  test("multi-page with correct URLs and prev/next", () => {
    const page = makePage("/blog/", "blog/index.html", { collection: "posts" });
    const items = makeItems(7);
    const result = expandPagination(page, items, config);

    expect(result.pages).toHaveLength(3);
    expect(result.paginators).toHaveLength(3);

    // Page 1
    expect(result.paginators[0].previousUrl).toBeNull();
    expect(result.paginators[0].nextUrl).toBe("/blog/page/2/");
    expect(result.paginators[0].items).toHaveLength(3);

    // Page 2
    expect(result.paginators[1].previousUrl).toBe("/blog/");
    expect(result.paginators[1].nextUrl).toBe("/blog/page/3/");
    expect(result.paginators[1].items).toHaveLength(3);

    // Page 3
    expect(result.paginators[2].previousUrl).toBe("/blog/page/2/");
    expect(result.paginators[2].nextUrl).toBeNull();
    expect(result.paginators[2].items).toHaveLength(1);
  });

  test("empty collection produces one page", () => {
    const page = makePage("/blog/", "blog/index.html", { collection: "posts" });
    const result = expandPagination(page, [], config);

    expect(result.pages).toHaveLength(1);
    expect(result.paginators[0].totalPages).toBe(1);
    expect(result.paginators[0].items).toHaveLength(0);
  });
});
