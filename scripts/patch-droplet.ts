#!/usr/bin/env bun
/**
 * Patch droplet package for proper ESM support in Bun.
 * droplet ships with mixed ESM imports + CJS module.exports,
 * which Bun can't resolve. This script:
 * 1. Creates .mjs entry point (always treated as ESM by Bun)
 * 2. Renames src/*.js → src/*.mjs for consistent ESM resolution
 * 3. Updates package.json exports to point to .mjs files
 * 4. Converts ext/ CJS files to ESM .mjs
 */
import { readFile, writeFile, readdir, rename } from "fs/promises";
import { join, basename, extname } from "path";
import { existsSync } from "fs";

const DROPLET_DIR = join(import.meta.dir, "../node_modules/droplet");

async function patch() {
  // 1. Rename all src/*.js → src/*.mjs and fix internal imports
  const srcDir = join(DROPLET_DIR, "src");
  const srcFiles = await readdir(srcDir);
  for (const file of srcFiles) {
    if (!file.endsWith(".js")) continue;
    const full = join(srcDir, file);
    let content = await readFile(full, "utf-8");
    // Fix imports to use .mjs extension
    content = content.replace(/from "\.\/([^"]+)\.js"/g, 'from "./$1.mjs"');
    const mjsPath = full.replace(/\.js$/, ".mjs");
    await writeFile(mjsPath, content);
  }

  // 2. Create droplet.mjs entry from src/index.mjs with fixed paths
  const srcIndex = await readFile(join(srcDir, "index.mjs"), "utf-8");
  const fixed = srcIndex.replace(/from "\.\/([^"]+)"/g, 'from "./src/$1"');
  await writeFile(join(DROPLET_DIR, "droplet.mjs"), fixed);

  // 3. Update package.json to point to .mjs entry
  const pkgPath = join(DROPLET_DIR, "package.json");
  const pkg = JSON.parse(await readFile(pkgPath, "utf-8"));
  pkg.type = "module";
  pkg.main = "droplet.mjs";
  pkg.exports = {
    ".": { "default": "./droplet.mjs" },
    "./ext/liquid-compat": { "default": "./ext/liquid-compat.mjs" },
    "./ext/partials": { "default": "./ext/partials.mjs" },
  };
  await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

  // 4. Convert ext/liquid-compat.js → .mjs
  const compatPath = join(DROPLET_DIR, "ext/liquid-compat.js");
  let compat = await readFile(compatPath, "utf-8");
  compat = compat
    .replace('const Droplet = require("../droplet");', 'import Droplet from "../droplet.mjs";')
    .replace('const partials = require("./partials");', 'import partials from "./partials.mjs";')
    .replace(/const fs = require\("fs"\);/g, 'import fs from "fs";')
    .replace(/^module\.exports\s*=\s*.+$/m, 'export { Liquid };\nexport const LiquidError = Droplet.LiquidError;');
  await writeFile(join(DROPLET_DIR, "ext/liquid-compat.mjs"), compat);

  // 5. Convert ext/partials.js → .mjs
  const partialsPath = join(DROPLET_DIR, "ext/partials.js");
  let partials = await readFile(partialsPath, "utf-8");
  partials = partials.replace(/^module\.exports = /m, "export default ");
  await writeFile(join(DROPLET_DIR, "ext/partials.mjs"), partials);

  // Also keep the .js versions for backwards compat with existing local installs
  await writeFile(join(DROPLET_DIR, "droplet.js"), fixed);

  console.log("[ice] Patched droplet for ESM compatibility");
}

patch().catch(console.error);
