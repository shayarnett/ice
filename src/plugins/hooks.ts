import type { HookName, HookCallback, HookContext } from "../types";

export class HookSystem {
  private hooks = new Map<HookName, HookCallback[]>();

  on(event: HookName, fn: HookCallback) {
    const list = this.hooks.get(event) ?? [];
    list.push(fn);
    this.hooks.set(event, list);
  }

  async emit(event: HookName, context: HookContext) {
    const list = this.hooks.get(event) ?? [];
    for (const fn of list) {
      await fn(context);
    }
  }
}
