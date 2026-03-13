import { describe, expect, test } from "bun:test";
import { BuildCache, computeHash } from "./cache";
import type { IceConfig } from "../types";

describe("computeHash", () => {
  test("returns consistent 16-char hex string", () => {
    const hash = computeHash("hello world");
    expect(hash).toHaveLength(16);
    expect(hash).toMatch(/^[0-9a-f]{16}$/);
    expect(computeHash("hello world")).toBe(hash);
  });

  test("different content produces different hashes", () => {
    expect(computeHash("foo")).not.toBe(computeHash("bar"));
  });
});

describe("BuildCache", () => {
  function makeCache() {
    const config = { cacheDir: "/tmp/test-cache" } as IceConfig;
    return new BuildCache(config);
  }

  test("isDirty returns true for missing entries", () => {
    const cache = makeCache();
    expect(cache.isDirty("unknown.md", "abc123")).toBe(true);
  });

  test("isDirty returns false when hashes match", () => {
    const cache = makeCache();
    cache.setEntry("page.md", {
      contentHash: "abc123",
      dependencies: [],
      outputPaths: [],
    });
    expect(cache.isDirty("page.md", "abc123")).toBe(false);
  });

  test("isDirty returns true when hashes differ", () => {
    const cache = makeCache();
    cache.setEntry("page.md", {
      contentHash: "abc123",
      dependencies: [],
      outputPaths: [],
    });
    expect(cache.isDirty("page.md", "def456")).toBe(true);
  });

  test("computeDirtySet propagates through dependency chains", () => {
    const cache = makeCache();

    // page-a depends on layout-default
    cache.setEntry("page-a.md", {
      contentHash: "aaa",
      dependencies: ["layout-default.html"],
      outputPaths: [],
    });
    // page-b depends on layout-default
    cache.setEntry("page-b.md", {
      contentHash: "bbb",
      dependencies: ["layout-default.html"],
      outputPaths: [],
    });
    // page-c depends on layout-post, which depends on layout-default
    cache.setEntry("page-c.md", {
      contentHash: "ccc",
      dependencies: ["layout-post.html"],
      outputPaths: [],
    });
    cache.setEntry("layout-post.html", {
      contentHash: "ddd",
      dependencies: ["layout-default.html"],
      outputPaths: [],
    });

    const changed = new Set(["layout-default.html"]);
    const dirty = cache.computeDirtySet(changed);

    expect(dirty.has("layout-default.html")).toBe(true);
    expect(dirty.has("page-a.md")).toBe(true);
    expect(dirty.has("page-b.md")).toBe(true);
    expect(dirty.has("layout-post.html")).toBe(true);
    expect(dirty.has("page-c.md")).toBe(true);
  });

  test("computeDirtySet handles no propagation", () => {
    const cache = makeCache();
    cache.setEntry("page-a.md", {
      contentHash: "aaa",
      dependencies: [],
      outputPaths: [],
    });

    const changed = new Set(["page-a.md"]);
    const dirty = cache.computeDirtySet(changed);
    expect(dirty.size).toBe(1);
    expect(dirty.has("page-a.md")).toBe(true);
  });
});
