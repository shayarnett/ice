import { join } from "path";
import { readFile, writeFile, mkdir } from "fs/promises";
import type { AssetManifest } from "../types";

const MANIFEST_FILENAME = "asset-manifest.json";

export class AssetManifestManager {
  private manifest: AssetManifest = {};

  constructor(private cacheDir: string) {}

  /** Load the manifest from disk. */
  async load(): Promise<void> {
    try {
      const raw = await readFile(this.manifestPath(), "utf-8");
      this.manifest = JSON.parse(raw);
    } catch {
      this.manifest = {};
    }
  }

  /** Save the manifest to disk. */
  async save(): Promise<void> {
    await mkdir(this.cacheDir, { recursive: true });
    await writeFile(this.manifestPath(), JSON.stringify(this.manifest, null, 2), "utf-8");
  }

  /** Set the full manifest (typically from processAssets). */
  setManifest(manifest: AssetManifest): void {
    this.manifest = { ...manifest };
  }

  /** Get the output path for an original asset path. Returns fingerprinted path if available. */
  get(originalPath: string): string {
    return this.manifest[originalPath] ?? originalPath;
  }

  /** Get the full manifest. */
  getAll(): AssetManifest {
    return { ...this.manifest };
  }

  private manifestPath(): string {
    return join(this.cacheDir, MANIFEST_FILENAME);
  }
}
