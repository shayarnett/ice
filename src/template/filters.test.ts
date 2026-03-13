import { describe, expect, test } from "bun:test";
import { registerFilters } from "./filters";
import type { IceConfig, AssetManifest } from "../types";

function captureFilters(config?: Partial<IceConfig>, manifest?: AssetManifest) {
  const filters: Record<string, (...args: unknown[]) => unknown> = {};
  const mockEngine = {
    registerFilter(name: string, fn: (...args: unknown[]) => unknown) {
      filters[name] = fn;
    },
  };

  const fullConfig = {
    url: "https://example.com",
    baseUrl: "/blog",
    markdown: { linkify: true, typographer: true, highlight: { theme: "github-dark" } },
    ...config,
  } as IceConfig;

  registerFilters(mockEngine, fullConfig, manifest ?? {});
  return filters;
}

describe("filters", () => {
  test("slugify converts to URL slug", () => {
    const f = captureFilters();
    expect(f.slugify("Hello World!")).toBe("hello-world");
    expect(f.slugify("  Spaces & Symbols!!! ")).toBe("spaces-symbols");
    expect(f.slugify("")).toBe("");
  });

  test("reading_time estimates minutes", () => {
    const f = captureFilters();
    expect(f.reading_time("short")).toBe("1 min read");

    const longText = Array(400).fill("word").join(" ");
    expect(f.reading_time(longText)).toBe("2 min read");

    expect(f.reading_time("")).toBe("1 min read");
  });

  test("xml_escape escapes special characters", () => {
    const f = captureFilters();
    expect(f.xml_escape('<script>alert("xss")</script>')).toBe(
      "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;",
    );
    expect(f.xml_escape("a&b")).toBe("a&amp;b");
    expect(f.xml_escape("")).toBe("");
  });

  test("date_to_xmlschema formats to ISO 8601", () => {
    const f = captureFilters();
    const result = f.date_to_xmlschema("2024-06-15T12:00:00Z") as string;
    expect(result).toBe("2024-06-15T12:00:00.000Z");

    const fromDate = f.date_to_xmlschema(new Date("2024-01-01")) as string;
    expect(fromDate).toContain("2024-01-01");
  });

  test("json stringifies input", () => {
    const f = captureFilters();
    expect(f.json({ a: 1 })).toBe('{"a":1}');
    expect(f.json("hello")).toBe('"hello"');
  });

  test("asset_url looks up manifest and prepends baseUrl", () => {
    const manifest: AssetManifest = {
      "css/main.css": "css/main-abc123.css",
    };
    const f = captureFilters({}, manifest);

    expect(f.asset_url("css/main.css")).toBe("/blog/css/main-abc123.css");
    expect(f.asset_url("css/other.css")).toBe("/blog/css/other.css");
  });

  test("absolute_url prepends site url + baseUrl", () => {
    const f = captureFilters();
    expect(f.absolute_url("/about/")).toBe("https://example.com/blog/about/");
    expect(f.absolute_url("")).toBe("https://example.com/blog");
  });

  test("relative_url prepends baseUrl", () => {
    const f = captureFilters();
    expect(f.relative_url("/about/")).toBe("/blog/about/");
    expect(f.relative_url("")).toBe("/blog");
  });
});
