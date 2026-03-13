import MarkdownIt from "markdown-it";
import type { IceConfig } from "../types";

export class MarkdownEngine {
  private md: MarkdownIt;

  constructor(config: IceConfig) {
    this.md = new MarkdownIt({
      html: true,
      linkify: config.markdown.linkify ?? true,
      typographer: config.markdown.typographer ?? true,
    });
  }

  /**
   * Set a custom highlight function (e.g., from shiki integration).
   */
  setHighlight(fn: (code: string, lang: string, attrs: string) => string): void {
    this.md.options.highlight = fn;
  }

  render(content: string): string {
    return this.md.render(content);
  }

  /** Expose for plugins that need to add markdown-it plugins */
  getEngine(): MarkdownIt {
    return this.md;
  }
}
