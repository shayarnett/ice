import type { IceConfig, AssetManifest } from "../types";
import { MarkdownEngine } from "../markdown/index";

interface LiquidLike {
  registerFilter(name: string, fn: (...args: any[]) => unknown): void;
}

export function registerFilters(
  engine: LiquidLike,
  config: IceConfig,
  assetManifest: AssetManifest,
): void {
  const md = new MarkdownEngine(config);

  // asset_url: look up fingerprinted path, prepend baseUrl
  engine.registerFilter("asset_url", (path: string) => {
    const fingerprinted = assetManifest[path] ?? path;
    return joinUrl(config.baseUrl, fingerprinted);
  });

  // absolute_url: prepend site.url + baseUrl
  engine.registerFilter("absolute_url", (path: string) => {
    const base = config.url.replace(/\/+$/, "") + config.baseUrl.replace(/\/+$/, "");
    if (!path) return base;
    return base + "/" + path.replace(/^\/+/, "");
  });

  // relative_url: prepend baseUrl
  engine.registerFilter("relative_url", (path: string) => {
    return joinUrl(config.baseUrl, path);
  });

  // markdownify: render markdown string to HTML
  engine.registerFilter("markdownify", (input: string) => {
    if (!input) return "";
    return md.render(input);
  });

  // slugify: convert string to URL slug
  engine.registerFilter("slugify", (input: string) => {
    if (!input) return "";
    return input
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  });

  // reading_time: estimate reading time (words / 200)
  engine.registerFilter("reading_time", (input: string) => {
    if (!input) return "1 min read";
    const words = input.trim().split(/\s+/).length;
    const minutes = Math.max(1, Math.ceil(words / 200));
    return `${minutes} min read`;
  });

  // date_to_xmlschema: format date to ISO 8601
  engine.registerFilter("date_to_xmlschema", (input: string | Date) => {
    const d = input instanceof Date ? input : new Date(input);
    return d.toISOString();
  });

  // xml_escape: escape XML special characters
  engine.registerFilter("xml_escape", (input: string) => {
    if (!input) return "";
    return input
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  });

  // json: JSON.stringify
  engine.registerFilter("json", (input: unknown) => {
    return JSON.stringify(input);
  });
}

function joinUrl(base: string, path: string): string {
  if (!path) return base.replace(/\/+$/, "") || "/";
  const normalizedBase = base.replace(/\/+$/, "");
  const normalizedPath = path.replace(/^\/+/, "");
  return normalizedBase + "/" + normalizedPath;
}
