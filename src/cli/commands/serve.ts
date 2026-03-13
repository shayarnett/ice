import { resolve } from "path";
import { loadConfig } from "../../config";
import { Engine } from "../../core/engine";
import { startServer } from "../../server/index";
import { logger } from "../logger";

export async function serve(flags: Record<string, string | boolean>) {
  const root = resolve(process.cwd());
  const config = await loadConfig(root);

  if (flags.port) {
    config.serve.port = Number(flags.port);
  }

  const engine = new Engine(config);
  await engine.build({ drafts: !!flags.drafts, incremental: false, profile: false });

  const _server = await startServer(config, engine);
  logger.success(`Dev server running at http://localhost:${config.serve.port}`);

  if (flags.open) {
    const { exec } = await import("child_process");
    exec(`open http://localhost:${config.serve.port}`);
  }
}
