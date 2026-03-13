import { resolve } from "path";
import { rm } from "fs/promises";
import { loadConfig } from "../../config";
import { logger } from "../logger";

export async function clean(_flags: Record<string, string | boolean>) {
  const root = resolve(process.cwd());
  const config = await loadConfig(root);

  await rm(config.outDir, { recursive: true, force: true });
  await rm(config.cacheDir, { recursive: true, force: true });

  logger.success("Cleaned _site/ and .ice-cache/");
}
