import { join } from "path";
import type { Page, IceConfig } from "../types";

export function buildTaxonomyPages(pages: Page[], config: IceConfig): Page[] {
  const taxonomyPages: Page[] = [];

  for (const [taxonomy, taxConfig] of Object.entries(config.taxonomies)) {
    const grouped = collectValues(pages, taxonomy);

    for (const [value, matchingPages] of Object.entries(grouped)) {
      const url = taxConfig.permalink.replace(`:${singularize(taxonomy)}`, slugify(value));

      const taxonomyPage: Page = {
        sourcePath: "",
        relativePath: "",
        url,
        outputPath: join(config.outDir, url.replace(/^\//, ""), "index.html"),
        rawContent: "",
        content: "",
        data: {
          title: value,
          taxonomy,
          taxonomyValue: value,
          pages: matchingPages,
          layout: taxonomy,
        },
        contentHash: "",
        layoutChain: [],
        includeDeps: [],
        excerpt: "",
      };

      taxonomyPages.push(taxonomyPage);
    }
  }

  return taxonomyPages;
}

function collectValues(pages: Page[], taxonomy: string): Record<string, Page[]> {
  const result: Record<string, Page[]> = {};

  for (const page of pages) {
    const values = page.data[taxonomy];
    if (!Array.isArray(values)) continue;

    for (const val of values) {
      const key = String(val);
      if (!result[key]) result[key] = [];
      result[key].push(page);
    }
  }

  return result;
}

function singularize(word: string): string {
  if (word.endsWith("ies")) return word.slice(0, -3) + "y";
  if (word.endsWith("s")) return word.slice(0, -1);
  return word;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
