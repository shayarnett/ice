import { join } from "path";
import type { IceConfig } from "./types";

const DEFAULTS: Omit<IceConfig, "root" | "outDir" | "cacheDir"> = {
  title: "My Site",
  url: "http://localhost:4000",
  baseUrl: "/",
  permalink: "/blog/:year/:month/:slug/",
  collections: {},
  taxonomies: {
    tags: { permalink: "/tags/:tag/" },
    categories: { permalink: "/categories/:category/" },
  },
  pagination: { perPage: 10 },
  markdown: { linkify: true, typographer: true, highlight: { theme: "github-dark" } },
  assets: { fingerprint: false, minify: false },
  feeds: {},
  serve: { port: 4000, livereload: true },
  plugins: [],
};

export async function loadConfig(root: string): Promise<IceConfig> {
  const configPath = join(root, "ice.config.ts");
  let userConfig: Partial<IceConfig> = {};

  try {
    const mod = await import(configPath);
    userConfig = mod.default ?? mod;
  } catch {
    // No config file — use defaults
  }

  return {
    ...DEFAULTS,
    ...userConfig,
    collections: { ...DEFAULTS.collections, ...userConfig.collections },
    taxonomies: { ...DEFAULTS.taxonomies, ...userConfig.taxonomies },
    markdown: { ...DEFAULTS.markdown, ...userConfig.markdown },
    assets: { ...DEFAULTS.assets, ...userConfig.assets },
    serve: { ...DEFAULTS.serve, ...userConfig.serve },
    pagination: { ...DEFAULTS.pagination, ...userConfig.pagination },
    root,
    outDir: join(root, "_site"),
    cacheDir: join(root, ".ice-cache"),
  };
}
