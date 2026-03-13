import { join, dirname } from "path";
import { mkdir, writeFile } from "fs/promises";
import type { Page, IceConfig } from "../types";

/**
 * Write a rendered page to the output directory.
 */
export async function writePage(page: Page, config: IceConfig): Promise<void> {
  const outPath = page.outputPath;
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, page.content, "utf-8");
}

/**
 * Write multiple rendered pages to the output directory.
 */
export async function writePages(pages: Page[], config: IceConfig): Promise<void> {
  await Promise.all(pages.map((page) => writePage(page, config)));
}

/**
 * Write a .nojekyll file to the output directory (for GitHub Pages compatibility).
 */
export async function writeNoJekyll(config: IceConfig): Promise<void> {
  const outPath = join(config.outDir, ".nojekyll");
  await mkdir(config.outDir, { recursive: true });
  await writeFile(outPath, "", "utf-8");
}

/**
 * Resolve the output path for a page based on its URL.
 * URLs ending in / get index.html appended.
 */
export function resolveOutputPath(url: string, config: IceConfig): string {
  let filePath = url;

  // URLs ending in / should produce an index.html file
  if (filePath.endsWith("/")) {
    filePath = filePath + "index.html";
  }

  // Ensure no leading slash for join
  filePath = filePath.replace(/^\//, "");

  return join(config.outDir, filePath);
}

/**
 * Clean the output directory before a full build.
 */
export async function cleanOutput(config: IceConfig): Promise<void> {
  const { rm } = await import("fs/promises");
  try {
    await rm(config.outDir, { recursive: true, force: true });
  } catch {
    // Directory may not exist
  }
  await mkdir(config.outDir, { recursive: true });
}
