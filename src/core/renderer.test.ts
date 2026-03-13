import { describe, expect, test } from "bun:test";
import { resolvePermalink } from "./renderer";
import type { Page } from "../types";

function makePage(data: Page["data"], relativePath = "test.md"): Page {
  return {
    sourcePath: "",
    relativePath,
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

describe("resolvePermalink", () => {
  test("resolves :year, :month, :day, :slug", () => {
    const page = makePage({
      title: "Hello World",
      slug: "hello-world",
      date: new Date("2024-06-15"),
    });
    const result = resolvePermalink("/:year/:month/:day/:slug/", page);
    expect(result).toBe("/2024/06/15/hello-world/");
  });

  test("resolves :title from page title", () => {
    const page = makePage({
      title: "My Great Post",
      date: new Date("2024-01-01"),
    });
    const result = resolvePermalink("/:year/:title/", page);
    expect(result).toBe("/2024/my-great-post/");
  });

  test("uses filename slug when no title or explicit slug", () => {
    const page = makePage({ date: new Date("2024-03-10") }, "2024-03-10-my-post.md");
    const result = resolvePermalink("/:year/:month/:slug/", page);
    expect(result).toBe("/2024/03/my-post/");
  });

  test("cleans up double slashes", () => {
    const page = makePage({
      slug: "test",
      categories: [],
      date: new Date("2024-01-01"),
    });
    const result = resolvePermalink("/:categories/:slug/", page);
    expect(result).not.toContain("//");
  });

  test("ensures leading slash", () => {
    const page = makePage({
      slug: "test",
      date: new Date("2024-01-01"),
    });
    const result = resolvePermalink(":slug/", page);
    expect(result).toMatch(/^\//);
  });
});
