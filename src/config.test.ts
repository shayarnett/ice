import { describe, expect, test } from "bun:test";
import { loadConfig } from "./config";

describe("loadConfig", () => {
  test("returns defaults when no config file exists", async () => {
    const config = await loadConfig("/tmp/nonexistent-ice-site");
    expect(config.title).toBe("My Site");
    expect(config.url).toBe("http://localhost:4000");
    expect(config.baseUrl).toBe("/");
    expect(config.permalink).toBe("/blog/:year/:month/:slug/");
    expect(config.pagination.perPage).toBe(10);
    expect(config.root).toBe("/tmp/nonexistent-ice-site");
    expect(config.outDir).toContain("_site");
    expect(config.cacheDir).toContain(".ice-cache");
  });

  test("default taxonomies are present", async () => {
    const config = await loadConfig("/tmp/nonexistent-ice-site");
    expect(config.taxonomies.tags).toBeDefined();
    expect(config.taxonomies.tags.permalink).toBe("/tags/:tag/");
    expect(config.taxonomies.categories).toBeDefined();
    expect(config.taxonomies.categories.permalink).toBe("/categories/:category/");
  });

  test("default markdown settings are present", async () => {
    const config = await loadConfig("/tmp/nonexistent-ice-site");
    expect(config.markdown.linkify).toBe(true);
    expect(config.markdown.typographer).toBe(true);
    expect(config.markdown.highlight?.theme).toBe("github-dark");
  });

  test("default assets settings are present", async () => {
    const config = await loadConfig("/tmp/nonexistent-ice-site");
    expect(config.assets.fingerprint).toBe(false);
    expect(config.assets.minify).toBe(false);
  });
});
