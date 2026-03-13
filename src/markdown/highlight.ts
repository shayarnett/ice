import { createHighlighter, type Highlighter } from "shiki";

/**
 * Create a markdown-it compatible highlight function backed by shiki.
 * Call this once during init and pass the result to MarkdownEngine.setHighlight().
 */
export async function createShikiHighlighter(
  theme: string = "github-dark",
): Promise<(code: string, lang: string, _attrs: string) => string> {
  let highlighter: Highlighter;

  try {
    highlighter = await createHighlighter({
      themes: [theme],
      langs: [
        "javascript",
        "typescript",
        "html",
        "css",
        "json",
        "yaml",
        "markdown",
        "bash",
        "shell",
        "ruby",
        "python",
        "go",
        "rust",
        "sql",
        "jsx",
        "tsx",
      ],
    });
  } catch {
    // If shiki fails to load, return a no-op highlighter
    return (code: string, lang: string) => {
      const escaped = escapeHtml(code);
      return `<pre><code class="language-${lang}">${escaped}</code></pre>`;
    };
  }

  return (code: string, lang: string): string => {
    try {
      // Load the language on demand if not already loaded
      return highlighter.codeToHtml(code, { lang: lang || "text", theme });
    } catch {
      const escaped = escapeHtml(code);
      return `<pre><code class="language-${lang}">${escaped}</code></pre>`;
    }
  };
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
