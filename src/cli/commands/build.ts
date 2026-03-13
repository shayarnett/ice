import { resolve } from "path";
import { loadConfig } from "../../config";
import { Engine } from "../../core/engine";
import { logger } from "../logger";

export async function build(flags: Record<string, string | boolean>) {
  const done = logger.time("Build complete");
  const root = resolve(process.cwd());
  const config = await loadConfig(root);

  const engine = new Engine(config);
  await engine.build({
    incremental: !!flags.incremental,
    drafts: !!flags.drafts,
    profile: !!flags.profile,
  });

  done();
}
