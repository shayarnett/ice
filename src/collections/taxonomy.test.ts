import { describe, expect, test } from "bun:test";
import { buildTaxonomyPages } from "./taxonomy";
import type { Page, IceConfig } from "../types";

function makePage(data: Page["data"]): Page {
  return {
    sourcePath: "",
    relativePath: "",
    url: "",
    outputPath: "",
    rawContent: "",
    content: "",
    data,
    contentHash: "",
    layoutChain: [],
    includeDeps: [],
    excerpt: "",
  };
}

describe("buildTaxonomyPages", () => {
  const config = {
    outDir: "_site",
    taxonomies: {
      tags: { permalink: "/tags/:tag/" },
      categories: { permalink: "/categories/:category/" },
    },
  } as unknown as IceConfig;

  test("groups pages by tags", () => {
    const pages = [
      makePage({ tags: ["javascript", "testing"] }),
      makePage({ tags: ["javascript"] }),
      makePage({ tags: ["rust"] }),
    ];

    const result = buildTaxonomyPages(pages, config);
    const tagPages = result.filter((p) => p.data.taxonomy === "tags");

    expect(tagPages).toHaveLength(3); // javascript, testing, rust
    const jsTaxPage = tagPages.find((p) => p.data.taxonomyValue === "javascript");
    expect(jsTaxPage).toBeDefined();
    expect((jsTaxPage!.data.pages as Page[]).length).toBe(2);
  });

  test("singularizes taxonomy names in permalink", () => {
    const pages = [makePage({ tags: ["hello"] })];
    const result = buildTaxonomyPages(pages, config);

    const tagPage = result.find((p) => p.data.taxonomyValue === "hello");
    expect(tagPage).toBeDefined();
    expect(tagPage!.url).toBe("/tags/hello/");
  });

  test("singularizes categories correctly", () => {
    const pages = [makePage({ categories: ["Web Dev"] })];
    const result = buildTaxonomyPages(pages, config);

    const catPage = result.find((p) => p.data.taxonomyValue === "Web Dev");
    expect(catPage).toBeDefined();
    expect(catPage!.url).toBe("/categories/web-dev/");
  });

  test("handles pages with no taxonomy values", () => {
    const pages = [makePage({ title: "No tags" })];
    const result = buildTaxonomyPages(pages, config);
    expect(result).toHaveLength(0);
  });
});
