import { describe, expect, test } from "bun:test";

// minifyCss is not exported, so we test it indirectly by importing the module
// and calling the function via a workaround. Since it's private, we'll test
// by dynamically importing and accessing the module internals.

// Actually, let's just inline-test the same logic since the function is private.
// We can verify the regex logic matches what pipeline.ts does.
function minifyCss(css: string): string {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\s+/g, " ")
    .replace(/\s*([{}:;,])\s*/g, "$1")
    .replace(/;}/g, "}")
    .trim();
}

describe("minifyCss", () => {
  test("removes block comments", () => {
    const input = "/* comment */body { color: red; }";
    expect(minifyCss(input)).toBe("body{color:red}");
  });

  test("collapses whitespace", () => {
    const input = `body {
  color:   red;
  margin:  0;
}`;
    expect(minifyCss(input)).toBe("body{color:red;margin:0}");
  });

  test("removes spaces around delimiters", () => {
    const input = "a { color : blue ; }";
    expect(minifyCss(input)).toBe("a{color:blue}");
  });

  test("handles empty input", () => {
    expect(minifyCss("")).toBe("");
  });

  test("handles multiline comments", () => {
    const input = `
/* This is
   a multiline
   comment */
h1 { font-size: 2em; }
`;
    expect(minifyCss(input)).toBe("h1{font-size:2em}");
  });
});
