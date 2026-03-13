import { describe, expect, test } from "bun:test";
import { parsePostFilename, buildPostsCollection } from "./posts";
import type { Page, IceConfig } from "../types";

describe("parsePostFilename", () => {
  test("parses valid date-slug pattern", () => {
    const result = parsePostFilename("2024-01-15-hello-world.md");
    expect(result).not.toBeNull();
    expect(result!.slug).toBe("hello-world");
    expect(result!.date.getFullYear()).toBe(2024);
    expect(result!.date.getMonth()).toBe(0); // January
    expect(result!.date.getDate()).toBe(15);
  });

  test("returns null for invalid filenames", () => {
    expect(parsePostFilename("hello-world.md")).toBeNull();
    expect(parsePostFilename("2024-01-hello.md")).toBeNull();
    expect(parsePostFilename("not-a-post.txt")).toBeNull();
    expect(parsePostFilename("")).toBeNull();
  });

  test("parses filename with complex slug", () => {
    const result = parsePostFilename("2023-12-31-my-year-in-review.md");
    expect(result).not.toBeNull();
    expect(result!.slug).toBe("my-year-in-review");
    expect(result!.date.getMonth()).toBe(11); // December
    expect(result!.date.getDate()).toBe(31);
  });
});

describe("buildPostsCollection", () => {
  const config = {
    permalink: "/:year/:month/:slug/",
    collections: { posts: {} },
  } as unknown as IceConfig;

  function makePage(overrides: Partial<Page> & { data: Page["data"] }): Page {
    return {
      sourcePath: "",
      relativePath: overrides.relativePath ?? "test.md",
      url: "",
      outputPath: "",
      rawContent: "",
      content: "",
      contentHash: "",
      layoutChain: [],
      includeDeps: [],
      excerpt: "",
      ...overrides,
    };
  }

  test("sorts posts by date descending", () => {
    const pages = [
      makePage({ relativePath: "2024-01-01-first.md", data: { date: new Date("2024-01-01") } }),
      makePage({ relativePath: "2024-03-01-third.md", data: { date: new Date("2024-03-01") } }),
      makePage({ relativePath: "2024-02-01-second.md", data: { date: new Date("2024-02-01") } }),
    ];

    const posts = buildPostsCollection(pages, config);
    expect(posts[0].data.date.getMonth()).toBe(2); // March
    expect(posts[1].data.date.getMonth()).toBe(1); // February
    expect(posts[2].data.date.getMonth()).toBe(0); // January
  });

  test("builds prev/next links", () => {
    const pages = [
      makePage({ relativePath: "2024-01-01-a.md", data: { date: new Date("2024-01-01") } }),
      makePage({ relativePath: "2024-02-01-b.md", data: { date: new Date("2024-02-01") } }),
      makePage({ relativePath: "2024-03-01-c.md", data: { date: new Date("2024-03-01") } }),
    ];

    const posts = buildPostsCollection(pages, config);
    // posts[0] is newest (March), posts[2] is oldest (January)
    // next = newer (towards index 0), previous = older (towards end)
    expect(posts[0].next).toBeUndefined();
    expect(posts[0].previous).toBeDefined();
    expect(posts[1].next).toBeDefined();
    expect(posts[1].previous).toBeDefined();
    expect(posts[2].next).toBeDefined();
    expect(posts[2].previous).toBeUndefined();
  });
});
