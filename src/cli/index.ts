#!/usr/bin/env bun
import { parseArgs } from "./parseArgs";
import { logger } from "./logger";

const { command, flags } = parseArgs(process.argv.slice(2));

async function main() {
  switch (command) {
    case "build": {
      const { build } = await import("./commands/build");
      await build(flags);
      break;
    }
    case "serve": {
      const { serve } = await import("./commands/serve");
      await serve(flags);
      break;
    }
    case "new": {
      const { newSite } = await import("./commands/new");
      await newSite(flags);
      break;
    }
    case "clean": {
      const { clean } = await import("./commands/clean");
      await clean(flags);
      break;
    }
    default:
      logger.error(`Unknown command: ${command}`);
      printUsage();
      process.exit(1);
  }
}

function printUsage() {
  console.log(`
ice - Static Site Generator

Usage:
  ice build [--incremental] [--drafts] [--profile]
  ice serve [--port <n>] [--open] [--drafts]
  ice new <name> [--template blog|docs|minimal]
  ice clean
`);
}

main().catch((err) => {
  logger.error(err.message);
  process.exit(1);
});
