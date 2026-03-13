import type {
  HookName,
  HookCallback,
  IceConfig,
  IcePluginAPI,
  Page,
} from "../types";
import { HookSystem } from "./hooks";

export class PluginAPI implements IcePluginAPI {
  private filters = new Map<string, Array<(...args: unknown[]) => unknown>>();
  private tags = new Map<string, unknown>();
  private injectedPages: Partial<Page>[] = [];
  private globalData = new Map<string, unknown>();

  constructor(
    private hooks: HookSystem,
    private config: IceConfig,
  ) {}

  on(event: HookName, fn: HookCallback): void {
    this.hooks.on(event, fn);
  }

  addFilter(name: string, fn: (...args: unknown[]) => unknown): void {
    const list = this.filters.get(name) ?? [];
    list.push(fn);
    this.filters.set(name, list);
  }

  addTag(name: string, tag: unknown): void {
    this.tags.set(name, tag);
  }

  addPage(page: Partial<Page>): void {
    this.injectedPages.push(page);
  }

  addGlobalData(key: string, value: unknown): void {
    this.globalData.set(key, value);
  }

  getConfig(): IceConfig {
    return this.config;
  }

  // ── Accessors for the engine to consume plugin contributions ──

  getFilters(): Map<string, Array<(...args: unknown[]) => unknown>> {
    return this.filters;
  }

  getTags(): Map<string, unknown> {
    return this.tags;
  }

  getInjectedPages(): Partial<Page>[] {
    return this.injectedPages;
  }

  getGlobalData(): Map<string, unknown> {
    return this.globalData;
  }

  async applyFilter(name: string, value: unknown, ...args: unknown[]): Promise<unknown> {
    const fns = this.filters.get(name) ?? [];
    let result = value;
    for (const fn of fns) {
      result = fn(result, ...args);
    }
    return result;
  }
}
