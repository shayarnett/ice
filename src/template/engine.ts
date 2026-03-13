import { readdir, readFile } from "fs/promises";
import { join, basename, extname } from "path";
import type { IceConfig, TemplateContext, AssetManifest } from "../types";
import { registerFilters } from "./filters";
import { registerTags } from "./tags";

import Droplet from "droplet";

/**
 * Thin LiquidJS-like wrapper around Droplet's core API.
 * Provides setTemplate, parseAndRender, registerFilter, registerTag.
 */
class Liquid {
  private droplet: InstanceType<typeof Droplet>;
  private templates = new Map<string, string>();

  constructor(_options: Record<string, unknown> = {}) {
    this.droplet = new Droplet();
  }

  registerFilter(name: string, fn: (...args: unknown[]) => unknown): void {
    this.droplet.registerFilter(name, fn);
  }

  registerTag(name: string, fn: unknown): void {
    this.droplet.registerTag(name, fn);
  }

  setTemplate(name: string, source: string): void {
    this.templates.set(name, source);
  }

  async parseAndRender(template: string, context: Record<string, unknown> = {}): Promise<string> {
    // Resolve {% include "name" %} by pre-processing
    const resolved = this.resolveIncludes(template, new Set());
    return this.droplet.parseAndRender(resolved, context);
  }

  private resolveIncludes(template: string, visited: Set<string>): string {
    return template.replace(
      /\{%-?\s*(?:include|render)\s+['"]([^'"]+)['"]\s*-?%\}/g,
      (_match, name: string) => {
        const key = name.replace(/\.liquid$/, "");
        if (visited.has(key)) return `<!-- circular include: ${key} -->`;
        visited.add(key);
        const src = this.templates.get(key) ?? this.templates.get(name) ?? "";
        return this.resolveIncludes(src, new Set(visited));
      },
    );
  }
}

export class TemplateEngine {
  private liquid: Liquid;
  private layoutsDir: string;
  private includesDir: string;
  private layoutCache = new Map<string, string>();

  constructor(
    private config: IceConfig,
    assetManifest: AssetManifest = {},
  ) {
    this.layoutsDir = join(config.root, "_layouts");
    this.includesDir = join(config.root, "_includes");

    this.liquid = new Liquid({
      extname: ".liquid",
      cache: true,
    });

    registerFilters(this.liquid, config, assetManifest);
    registerTags(this.liquid, config);
  }

  /**
   * Load layout and include templates from disk into the engine's
   * in-memory filesystem so {% include %} and {% render %} work.
   */
  async loadTemplates(): Promise<void> {
    await this.loadDir(this.layoutsDir, "layout");
    await this.loadDir(this.includesDir, "include");
  }

  private async loadDir(dir: string, _kind: string): Promise<void> {
    let entries: string[];
    try {
      entries = await readdir(dir);
    } catch {
      return; // directory doesn't exist — that's fine
    }

    for (const entry of entries) {
      const full = join(dir, entry);
      const name = basename(entry, extname(entry));
      const src = await readFile(full, "utf-8");

      if (_kind === "layout") {
        this.layoutCache.set(name, src);
      }
      // Register with the engine so {% include %} / {% render %} can find it
      this.liquid.setTemplate(name, src);
      // Also register with extension so both "name" and "name.liquid" resolve
      this.liquid.setTemplate(entry, src);
    }
  }

  /**
   * Render a template string with the given context.
   */
  async render(template: string, context: TemplateContext): Promise<string> {
    return this.liquid.parseAndRender(template, context as unknown as Record<string, unknown>);
  }

  /**
   * Render content, then wrap it in layout(s), chaining until no more
   * layouts are specified. Layout templates can reference {{ content }}
   * and declare their own layout in a `layout:` comment/variable.
   */
  async renderWithLayout(
    content: string,
    layoutName: string,
    context: TemplateContext,
  ): Promise<string> {
    let rendered = content;
    let currentLayout: string | undefined = layoutName;
    const visited = new Set<string>();

    while (currentLayout) {
      if (visited.has(currentLayout)) {
        throw new Error(`Circular layout detected: ${currentLayout}`);
      }
      visited.add(currentLayout);

      const layoutSrc = this.layoutCache.get(currentLayout);
      if (!layoutSrc) {
        throw new Error(`Layout not found: ${currentLayout}`);
      }

      // The layout receives `content` as the rendered inner content
      const ctx = {
        ...context,
        content: rendered,
      } as unknown as Record<string, unknown>;

      rendered = await this.liquid.parseAndRender(layoutSrc, ctx);

      // Check if the layout itself specifies a parent layout via
      // a `layout: parentName` frontmatter-style comment.
      currentLayout = this.extractParentLayout(layoutSrc);
    }

    return rendered;
  }

  /**
   * Extract parent layout name from a layout template.
   * Looks for `{% assign layout = "name" %}` pattern.
   */
  private extractParentLayout(src: string): string | undefined {
    const match = src.match(/\{%-?\s*assign\s+layout\s*=\s*['"]([^'"]+)['"]\s*-?%\}/);
    return match?.[1];
  }

  /** Expose the underlying Liquid engine for plugin registration */
  getLiquid(): Liquid {
    return this.liquid;
  }
}
