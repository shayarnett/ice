import { watch, type FSWatcher } from "fs";
import type { IceConfig } from "../types";

export type WatchEventType = "change" | "add" | "remove";

export interface WatchEvent {
  type: WatchEventType;
  path: string; // absolute path
  relativePath: string;
}

export type WatchCallback = (event: WatchEvent) => void;

const IGNORE_PATTERNS = ["_site", ".ice-cache", "node_modules", ".git"];

/**
 * File system watcher for serve mode.
 * Watches the site root for changes and emits events.
 */
export class FileWatcher {
  private watcher: FSWatcher | null = null;
  private callbacks: WatchCallback[] = [];
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingEvents = new Map<string, WatchEvent>();
  private debounceMs: number;

  constructor(
    private config: IceConfig,
    options: { debounceMs?: number } = {},
  ) {
    this.debounceMs = options.debounceMs ?? 100;
  }

  /**
   * Register a callback for file change events.
   */
  onChange(callback: WatchCallback): void {
    this.callbacks.push(callback);
  }

  /**
   * Start watching the site root directory.
   */
  start(): void {
    if (this.watcher) return;

    this.watcher = watch(this.config.root, { recursive: true }, (eventType, filename) => {
      if (!filename) return;

      // Filter out ignored paths
      for (const pattern of IGNORE_PATTERNS) {
        if (filename.startsWith(pattern + "/") || filename === pattern) return;
      }

      const absolutePath = `${this.config.root}/${filename}`;
      const relativePath = filename;

      const event: WatchEvent = {
        type: eventType === "rename" ? "add" : "change",
        path: absolutePath,
        relativePath,
      };

      // Debounce: collect events and flush after quiet period
      this.pendingEvents.set(relativePath, event);
      this.scheduleFlush();
    });
  }

  /**
   * Stop watching.
   */
  stop(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
  }

  private scheduleFlush(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      this.flush();
    }, this.debounceMs);
  }

  private flush(): void {
    const events = [...this.pendingEvents.values()];
    this.pendingEvents.clear();

    for (const event of events) {
      for (const cb of this.callbacks) {
        cb(event);
      }
    }
  }
}
