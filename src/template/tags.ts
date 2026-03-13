import type { IceConfig } from "../types";

interface LiquidLike {
  registerTag(name: string, fn: unknown): void;
}

export function registerTags(engine: LiquidLike, _config: IceConfig): void {
  // {% highlight lang %}...{% endhighlight %} — pass-through code block tag
  // This is a compatibility shim; actual highlighting is done by markdown-it + shiki
  engine.registerTag("highlight", (tag: string) => {
    // The highlight/endhighlight block isn't natively supported in Droplet's
    // tag model (no block tags). For now, return the tag content as-is.
    // Users should prefer fenced code blocks in markdown.
    const lang = tag.slice(10).trim();
    return `<pre><code class="language-${lang}">`;
  });

  engine.registerTag("endhighlight", () => {
    return "</code></pre>";
  });
}
