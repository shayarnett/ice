import { describe, expect, test } from "bun:test";
import { parseFrontmatter } from "./frontmatter";

describe("parseFrontmatter", () => {
  test("parses frontmatter data and content", () => {
    const raw = `---
title: Hello World
date: 2024-01-15
---
This is the body content.`;

    const result = parseFrontmatter(raw);
    expect(result.data.title).toBe("Hello World");
    expect(result.content).toContain("This is the body content.");
  });

  test("handles missing frontmatter", () => {
    const raw = "Just plain content with no frontmatter.";
    const result = parseFrontmatter(raw);
    expect(result.data).toEqual({});
    expect(result.content).toBe("Just plain content with no frontmatter.");
  });

  test("extracts first paragraph as excerpt fallback", () => {
    const raw = `---
title: Test
---
First paragraph here.

Second paragraph here.`;

    const result = parseFrontmatter(raw);
    expect(result.excerpt).toBe("First paragraph here.");
  });

  test("returns empty excerpt for empty content", () => {
    const raw = `---
title: Empty
---
`;
    const result = parseFrontmatter(raw);
    expect(result.excerpt).toBe("");
  });
});
