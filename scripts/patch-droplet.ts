#!/usr/bin/env bun
/**
 * Patch droplet package for proper ESM support in Bun.
 * droplet ships with mixed ESM imports + CJS module.exports,
 * which Bun can't resolve. This script fixes it.
 */
import { readFile, writeFile, copyFile } from "fs/promises";
import { join } from "path";

const DROPLET_DIR = join(import.meta.dir, "../node_modules/droplet");

async function patch() {
  // 1. Fix package.json — add "type": "module"
  const pkgPath = join(DROPLET_DIR, "package.json");
  const pkg = JSON.parse(await readFile(pkgPath, "utf-8"));
  pkg.type = "module";
  await writeFile(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

  // 2. Create droplet.js from src/index.js with fixed import paths
  const srcIndex = await readFile(join(DROPLET_DIR, "src/index.js"), "utf-8");
  const fixed = srcIndex.replace(/from "\.\/([^"]+)"/g, 'from "./src/$1"');
  await writeFile(join(DROPLET_DIR, "droplet.js"), fixed);

  // 3. Fix ext/liquid-compat.js — convert require to import
  const compatPath = join(DROPLET_DIR, "ext/liquid-compat.js");
  let compat = await readFile(compatPath, "utf-8");
  compat = compat
    .replace('const Droplet = require("../droplet");', 'import Droplet from "../droplet.js";')
    .replace('const partials = require("./partials");', 'import partials from "./partials.js";')
    .replace(/const fs = require\("fs"\);/g, 'import fs from "fs";')
    // Remove the express() method's inline import (invalid ESM)
    .replace(/import fs from "fs";\n\s+fs\.readFile/g, 'const { readFile: _rf } = await import("fs");\n      _rf')
    .replace(/^module\.exports\s*=\s*.+$/m, 'export { Liquid };\nexport const LiquidError = Droplet.LiquidError;');
  await writeFile(compatPath, compat);

  // 4. Fix ext/partials.js
  const partialsPath = join(DROPLET_DIR, "ext/partials.js");
  let partials = await readFile(partialsPath, "utf-8");
  partials = partials.replace(/^module\.exports = /m, "export default ");
  await writeFile(partialsPath, partials);

  console.log("[ice] Patched droplet for ESM compatibility");
}

patch().catch(console.error);
