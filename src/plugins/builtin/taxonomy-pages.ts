import type { IcePlugin, Page } from "../../types";

const taxonomyPagesPlugin: IcePlugin = {
  name: "ice:taxonomy-pages",

  setup(api) {
    const config = api.getConfig();

    api.on("afterDiscover", async (ctx) => {
      for (const [taxonomy, taxConfig] of Object.entries(config.taxonomies)) {
        // Gather all unique values for this taxonomy across all pages
        const values = new Set<string>();
        for (const page of ctx.pages) {
          const pageValues = page.data[taxonomy];
          if (Array.isArray(pageValues)) {
            for (const v of pageValues) {
              if (typeof v === "string") values.add(v);
            }
          }
        }

        // Create a virtual listing page for each taxonomy value
        for (const value of values) {
          const slug = slugify(value);
          const url = taxConfig.permalink
            .replace(`:${singularize(taxonomy)}`, slug)
            .replace(`:${taxonomy}`, slug);

          const virtualPage: Partial<Page> = {
            url,
            rawContent: "",
            content: "",
            data: {
              title: `${capitalize(taxonomy)}: ${value}`,
              layout: "default",
              taxonomy,
              taxonomyValue: value,
            },
            relativePath: `_virtual/${taxonomy}/${slug}.html`,
            sourcePath: "",
            contentHash: "",
            layoutChain: [],
            includeDeps: [],
            excerpt: "",
          };

          api.addPage(virtualPage);
        }
      }
    });
  },
};

function singularize(word: string): string {
  if (word.endsWith("ies")) return word.slice(0, -3) + "y";
  if (word.endsWith("s")) return word.slice(0, -1);
  return word;
}

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default taxonomyPagesPlugin;
