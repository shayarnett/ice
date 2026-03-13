import type { ServerWebSocket } from "bun";

const LIVERELOAD_SCRIPT = `
<script>
(function() {
  var ws = new WebSocket("ws://" + location.host + "/__livereload");
  ws.onmessage = function(e) {
    if (e.data === "reload") location.reload();
  };
  ws.onclose = function() {
    setTimeout(function() { location.reload(); }, 1000);
  };
})();
</script>
`;

export class LiveReloadServer {
  private clients = new Set<ServerWebSocket<unknown>>();

  /** Inject the livereload script before </body> in HTML. */
  inject(html: string): string {
    const idx = html.lastIndexOf("</body>");
    if (idx !== -1) {
      return html.slice(0, idx) + LIVERELOAD_SCRIPT + html.slice(idx);
    }
    return html + LIVERELOAD_SCRIPT;
  }

  /** Register a new WebSocket client. */
  addClient(ws: ServerWebSocket<unknown>): void {
    this.clients.add(ws);
  }

  /** Remove a disconnected client. */
  removeClient(ws: ServerWebSocket<unknown>): void {
    this.clients.delete(ws);
  }

  /** Notify all connected clients to reload. */
  notify(): void {
    for (const ws of this.clients) {
      try {
        ws.send("reload");
      } catch {
        this.clients.delete(ws);
      }
    }
  }
}
