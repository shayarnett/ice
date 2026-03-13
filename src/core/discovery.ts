import { join, relative, sep } from "path";
import { Glob } from "bun";
import type { IceConfig, DiscoveredFile, FileType } from "../types";

const IGNORE_DIRS = new Set(["_plugins", "_site", ".ice-cache", "node_modules", ".git"]);
const IGNORE_FILES = new Set(["ice.config.ts", "ice.config.js", "package.json", "package-lock.json", "bun.lock", "bun.lockb", "tsconfig.json"]);
const CONTENT_EXTENSIONS = new Set([".md", ".markdown", ".html", ".htm", ".liquid"]);
const DATA_EXTENSIONS = new Set([".yml", ".yaml", ".json", ".csv", ".tsv"]);

/**
 * Discover all files in the site root and classify them by type.
 */
export async function discoverFiles(config: IceConfig): Promise<DiscoveredFile[]> {
  const files: DiscoveredFile[] = [];
  const collectionDirs = new Map<string, string>();

  // Build a map of collection directory names → collection names
  for (const [name, col] of Object.entries(config.collections)) {
    const dirName = col.directory.replace(/^\/|\/$/g, "");
    collectionDirs.set(dirName, name);
  }

  const glob = new Glob("**/*");
  for await (const entry of glob.scan({ cwd: config.root, dot: false })) {
    const absolutePath = join(config.root, entry);
    const relativePath = entry;

    const type = classifyFile(relativePath, collectionDirs);
    if (type === "ignore") continue;

    const file: DiscoveredFile = { absolutePath, relativePath, type };
    if (type === "collection") {
      // Determine which collection this belongs to
      const firstSegment = relativePath.split(sep)[0] ?? relativePath.split("/")[0];
      file.collectionName = collectionDirs.get(firstSegment);
    }
    files.push(file);
  }

  return files;
}

/**
 * Classify a file based on its relative path.
 */
function classifyFile(relativePath: string, collectionDirs: Map<string, string>): FileType {
  const segments = relativePath.split(/[/\\]/);
  const firstSegment = segments[0];

  // Check ignored directories
  if (firstSegment && IGNORE_DIRS.has(firstSegment)) {
    return "ignore";
  }

  // Check ignored files
  if (segments.length === 1 && IGNORE_FILES.has(relativePath)) {
    return "ignore";
  }

  // Dot-prefixed directories (e.g., .git) are ignored
  if (firstSegment?.startsWith(".")) {
    return "ignore";
  }

  // Underscore-prefixed directories are source artifacts
  if (firstSegment?.startsWith("_")) {
    if (firstSegment === "_posts") return "post";
    if (firstSegment === "_layouts") return "layout";
    if (firstSegment === "_includes") return "include";
    if (firstSegment === "_data") return "data";
    if (firstSegment === "_drafts") return "post";
    // Other _-prefixed dirs are ignored (e.g., _plugins, _site)
    if (IGNORE_DIRS.has(firstSegment)) return "ignore";
    return "ignore";
  }

  // Check collection directories
  if (firstSegment && collectionDirs.has(firstSegment)) {
    return "collection";
  }

  // Assets directory
  if (firstSegment === "assets") {
    return "asset";
  }

  // Data files at the root level
  const ext = getExtension(relativePath);
  if (DATA_EXTENSIONS.has(ext) && segments.length === 1) {
    return "data";
  }

  // Everything else with content extensions is a page
  if (CONTENT_EXTENSIONS.has(ext)) {
    return "page";
  }

  // Non-content files (images, etc.) are assets
  return "asset";
}

function getExtension(filePath: string): string {
  const dot = filePath.lastIndexOf(".");
  return dot === -1 ? "" : filePath.slice(dot).toLowerCase();
}
