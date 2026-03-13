import { readdir, readFile, stat } from "fs/promises";
import { join, basename, extname } from "path";
import { parse as parseYaml } from "yaml";

/**
 * Load data files from _data/ directory.
 * Supports .yml/.yaml (YAML), .json, and .ts files.
 * Nested directories become nested objects.
 * Keys are filenames without extension.
 */
export async function loadData(dataDir: string): Promise<Record<string, unknown>> {
  try {
    await stat(dataDir);
  } catch {
    return {};
  }

  return loadDir(dataDir);
}

async function loadDir(dir: string): Promise<Record<string, unknown>> {
  const result: Record<string, unknown> = {};
  const entries = await readdir(dir);

  for (const entry of entries) {
    // Skip hidden files
    if (entry.startsWith(".")) continue;

    const fullPath = join(dir, entry);
    const info = await stat(fullPath);

    if (info.isDirectory()) {
      result[entry] = await loadDir(fullPath);
      continue;
    }

    const ext = extname(entry).toLowerCase();
    const key = basename(entry, extname(entry));

    switch (ext) {
      case ".yml":
      case ".yaml": {
        const raw = await readFile(fullPath, "utf-8");
        result[key] = parseYaml(raw);
        break;
      }
      case ".json": {
        const raw = await readFile(fullPath, "utf-8");
        result[key] = JSON.parse(raw);
        break;
      }
      case ".ts": {
        const mod = await import(fullPath);
        result[key] = mod.default ?? mod;
        break;
      }
    }
  }

  return result;
}
