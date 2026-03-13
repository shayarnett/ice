import { join, resolve } from "path";
import { mkdir, cp, exists } from "fs/promises";
import { logger } from "../logger";

const VALID_TEMPLATES = ["blog", "docs", "minimal"] as const;
type Template = (typeof VALID_TEMPLATES)[number];

export async function newSite(flags: Record<string, string | boolean>) {
  const name = flags._positional as string;
  if (!name) {
    logger.error("Usage: ice new <name> [--template blog|docs|minimal]");
    process.exit(1);
  }

  const template = (flags.template as Template) || "blog";
  if (!VALID_TEMPLATES.includes(template as Template)) {
    logger.error(`Invalid template: ${template}. Use: ${VALID_TEMPLATES.join(", ")}`);
    process.exit(1);
  }

  const dest = resolve(process.cwd(), name);
  if (await exists(dest)) {
    logger.error(`Directory already exists: ${dest}`);
    process.exit(1);
  }

  const templateDir = join(import.meta.dir, "../../scaffold/templates", template);

  await mkdir(dest, { recursive: true });
  await cp(templateDir, dest, { recursive: true });

  logger.success(`Created new site: ${name} (template: ${template})`);
  logger.info(`  cd ${name}`);
  logger.info(`  bun install`);
  logger.info(`  ice serve`);
}
