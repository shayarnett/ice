import { join } from "path";
import { readFile, exists } from "fs/promises";
import { watch } from "fs";
import type { IceConfig } from "../types";
import { LiveReloadServer } from "./livereload";

interface Engine {
  build(opts: { incremental: boolean; drafts: boolean; profile: boolean }): Promise<unknown>;
}

/**
 * Start a dev server using Bun.serve(). Serves files from _site/,
 * handles clean URLs, custom 404, livereload, and file watching.
 */
export async function startServer(config: IceConfig, engine: Engine) {
  const liveReload = new LiveReloadServer();
  const useLiveReload = config.serve.livereload !== false;

  const server = Bun.serve({
    port: config.serve.port,

    async fetch(req, server) {
      const url = new URL(req.url);

      // Handle livereload WebSocket upgrade
      if (url.pathname === "/__livereload") {
        const upgraded = server.upgrade(req);
        if (upgraded) return undefined as unknown as Response;
        return new Response("WebSocket upgrade failed", { status: 400 });
      }

      // Resolve file path from URL
      const filePath = await resolveFilePath(config.outDir, url.pathname);

      if (!filePath) {
        // Serve custom 404 if it exists
        const custom404 = join(config.outDir, "404.html");
        if (await exists(custom404)) {
          let html = await readFile(custom404, "utf-8");
          if (useLiveReload) html = liveReload.inject(html);
          return new Response(html, {
            status: 404,
            headers: { "Content-Type": "text/html; charset=utf-8" },
          });
        }
        return new Response("Not Found", { status: 404 });
      }

      const content = await readFile(filePath);
      const contentType = getContentType(filePath);
      let body: string | Uint8Array = content;

      // Inject livereload into HTML
      if (useLiveReload && contentType === "text/html; charset=utf-8") {
        const html = content.toString("utf-8");
        body = liveReload.inject(html);
      }

      return new Response(body as BodyInit, {
        headers: { "Content-Type": contentType },
      });
    },

    websocket: {
      open(ws) {
        liveReload.addClient(ws);
      },
      close(ws) {
        liveReload.removeClient(ws);
      },
      message() {
        // No messages expected from client
      },
    },
  });

  // Watch for file changes and rebuild
  let rebuilding = false;
  const _watcher = watch(config.root, { recursive: true }, async (_event, filename) => {
    if (!filename) return;
    // Skip output dir, cache dir, and dotfiles
    if (
      filename.startsWith("_site") ||
      filename.startsWith(".ice-cache") ||
      filename.startsWith("node_modules") ||
      filename.startsWith(".")
    ) {
      return;
    }

    if (rebuilding) return;
    rebuilding = true;

    try {
      await engine.build({ incremental: true, drafts: true, profile: false });
      if (useLiveReload) liveReload.notify();
    } catch (err) {
      console.error("Rebuild failed:", err);
    } finally {
      rebuilding = false;
    }
  });

  return server;
}

async function resolveFilePath(outDir: string, pathname: string): Promise<string | null> {
  // Try exact path
  const exact = join(outDir, pathname);
  if ((await exists(exact)) && !isDirectory(exact)) {
    return exact;
  }

  // Clean URLs: try /path/index.html
  const withIndex = join(outDir, pathname, "index.html");
  if (await exists(withIndex)) {
    return withIndex;
  }

  // Try with .html extension
  const withHtml = join(outDir, pathname + ".html");
  if (await exists(withHtml)) {
    return withHtml;
  }

  return null;
}

function isDirectory(path: string): boolean {
  try {
    const _stat = Bun.file(path);
    // Bun.file doesn't have isDirectory — rely on exists + index.html fallback
    return false;
  } catch {
    return false;
  }
}

function getContentType(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase();
  const types: Record<string, string> = {
    html: "text/html; charset=utf-8",
    css: "text/css; charset=utf-8",
    js: "application/javascript; charset=utf-8",
    json: "application/json; charset=utf-8",
    xml: "application/xml; charset=utf-8",
    svg: "image/svg+xml",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    ico: "image/x-icon",
    woff: "font/woff",
    woff2: "font/woff2",
    ttf: "font/ttf",
    eot: "application/vnd.ms-fontobject",
    txt: "text/plain; charset=utf-8",
    map: "application/json",
  };
  return types[ext ?? ""] ?? "application/octet-stream";
}
