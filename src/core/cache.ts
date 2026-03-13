import { join } from "path";
import { mkdir, readFile, writeFile } from "fs/promises";
import { createHash } from "crypto";
import type { IceConfig, CacheManifest, CacheEntry } from "../types";

const MANIFEST_FILE = "manifest.json";
const CACHE_VERSION = 1;

/**
 * Incremental build cache.
 * Stores content hashes and dependency info to skip unchanged files.
 */
export class BuildCache {
  private manifest: CacheManifest;
  private manifestPath: string;

  constructor(private config: IceConfig) {
    this.manifestPath = join(config.cacheDir, MANIFEST_FILE);
    this.manifest = { version: CACHE_VERSION, entries: {} };
  }

  /**
   * Load the cache manifest from disk.
   */
  async load(): Promise<void> {
    try {
      const raw = await readFile(this.manifestPath, "utf-8");
      const data = JSON.parse(raw) as CacheManifest;
      if (data.version === CACHE_VERSION) {
        this.manifest = data;
      }
    } catch {
      // No cache or invalid — start fresh
      this.manifest = { version: CACHE_VERSION, entries: {} };
    }
  }

  /**
   * Save the cache manifest to disk.
   */
  async save(): Promise<void> {
    await mkdir(this.config.cacheDir, { recursive: true });
    await writeFile(this.manifestPath, JSON.stringify(this.manifest, null, 2), "utf-8");
  }

  /**
   * Get the cache entry for a source file.
   */
  getEntry(relativePath: string): CacheEntry | undefined {
    return this.manifest.entries[relativePath];
  }

  /**
   * Set the cache entry for a source file.
   */
  setEntry(relativePath: string, entry: CacheEntry): void {
    this.manifest.entries[relativePath] = entry;
  }

  /**
   * Remove a cache entry.
   */
  removeEntry(relativePath: string): void {
    delete this.manifest.entries[relativePath];
  }

  /**
   * Check if a file is dirty (needs rebuild).
   * Compares current content hash with cached hash.
   */
  isDirty(relativePath: string, currentHash: string): boolean {
    const entry = this.manifest.entries[relativePath];
    if (!entry) return true;
    return entry.contentHash !== currentHash;
  }

  /**
   * Given a set of changed file paths, compute all dirty files
   * by propagating through dependencies.
   * If a layout or include changes, all files depending on it are dirty.
   */
  computeDirtySet(changedFiles: Set<string>): Set<string> {
    const dirty = new Set(changedFiles);

    // Build a reverse dependency map: dependency → dependents
    const reverseDeps = new Map<string, Set<string>>();
    for (const [filePath, entry] of Object.entries(this.manifest.entries)) {
      for (const dep of entry.dependencies) {
        let dependents = reverseDeps.get(dep);
        if (!dependents) {
          dependents = new Set();
          reverseDeps.set(dep, dependents);
        }
        dependents.add(filePath);
      }
    }

    // Propagate: if a changed file is a dependency of other files, mark them dirty
    const queue = [...changedFiles];
    while (queue.length > 0) {
      const current = queue.pop()!;
      const dependents = reverseDeps.get(current);
      if (!dependents) continue;
      for (const dep of dependents) {
        if (!dirty.has(dep)) {
          dirty.add(dep);
          queue.push(dep);
        }
      }
    }

    return dirty;
  }

  /**
   * Get all entries in the manifest.
   */
  getAllEntries(): Record<string, CacheEntry> {
    return this.manifest.entries;
  }

  /**
   * Clear all cache entries.
   */
  clear(): void {
    this.manifest = { version: CACHE_VERSION, entries: {} };
  }
}

/**
 * Compute a content hash for a file.
 */
export function computeHash(content: string | Buffer): string {
  return createHash("sha256").update(content).digest("hex").slice(0, 16);
}
