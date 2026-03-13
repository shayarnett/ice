import matter from "gray-matter";

export interface ParsedFrontmatter {
  data: Record<string, unknown>;
  content: string;
  excerpt: string;
}

/**
 * Parse frontmatter from file content using gray-matter.
 * Returns parsed data, content body, and excerpt.
 */
export function parseFrontmatter(raw: string): ParsedFrontmatter {
  const result = matter(raw, { excerpt: true, excerpt_separator: "---" });

  // gray-matter's excerpt is the content before the first excerpt_separator
  // If no explicit separator, extract first paragraph as excerpt
  let excerpt = result.excerpt ?? "";
  if (!excerpt && result.content) {
    const firstPara = result.content.split(/\n\n/)[0];
    if (firstPara) {
      excerpt = firstPara.replace(/\n/g, " ").trim();
    }
  }

  return {
    data: result.data,
    content: result.content,
    excerpt,
  };
}
