import { join, dirname, extname, basename } from "path";
import { readFile, writeFile, mkdir, copyFile } from "fs/promises";
import { createHash } from "crypto";
import type { IceConfig, DiscoveredFile, AssetManifest } from "../types";

/**
 * Process discovered asset files: copy to output, optionally minify CSS,
 * optionally fingerprint filenames.
 */
export async function processAssets(
  config: IceConfig,
  discoveredAssets: DiscoveredFile[],
): Promise<AssetManifest> {
  const manifest: AssetManifest = {};

  for (const asset of discoveredAssets) {
    const ext = extname(asset.relativePath).toLowerCase();
    const outDir = join(config.outDir, dirname(asset.relativePath));
    await mkdir(outDir, { recursive: true });

    let content: Buffer | null = null;

    // Minify CSS if enabled
    if (config.assets.minify && ext === ".css") {
      const raw = await readFile(asset.absolutePath, "utf-8");
      const minified = minifyCss(raw);
      content = Buffer.from(minified, "utf-8");
    }

    // Determine output filename
    let outputRelative = asset.relativePath;

    if (config.assets.fingerprint) {
      const data = content ?? (await readFile(asset.absolutePath));
      const hash = createHash("md5").update(data).digest("hex").slice(0, 8);
      const base = basename(asset.relativePath, ext);
      const dir = dirname(asset.relativePath);
      outputRelative = join(dir, `${base}-${hash}${ext}`);
    }

    const outputPath = join(config.outDir, outputRelative);
    await mkdir(dirname(outputPath), { recursive: true });

    if (content) {
      await writeFile(outputPath, content);
    } else {
      await copyFile(asset.absolutePath, outputPath);
    }

    manifest[asset.relativePath] = outputRelative;
  }

  return manifest;
}

/**
 * Simple regex-based CSS minification: remove comments and collapse whitespace.
 */
function minifyCss(css: string): string {
  return css
    // Remove block comments
    .replace(/\/\*[\s\S]*?\*\//g, "")
    // Remove newlines and collapse whitespace
    .replace(/\s+/g, " ")
    // Remove spaces around delimiters
    .replace(/\s*([{}:;,])\s*/g, "$1")
    // Remove trailing semicolons before closing braces
    .replace(/;}/g, "}")
    .trim();
}
