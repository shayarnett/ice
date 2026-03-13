import { join } from "path";
import { readdir, exists } from "fs/promises";
import type { IceConfig, IcePlugin, IcePluginAPI } from "../types";

/**
 * Load plugins from config.plugins (npm packages) and auto-load from _plugins/ directory.
 */
export async function loadPlugins(
  config: IceConfig,
  api: IcePluginAPI,
): Promise<void> {
  // 1. Load plugins listed in config.plugins (npm packages or local paths)
  for (const specifier of config.plugins) {
    const plugin = await loadPluginModule(specifier);
    if (plugin) {
      await plugin.setup(api);
    }
  }

  // 2. Auto-load plugins from _plugins/ directory
  const pluginsDir = join(config.root, "_plugins");
  if (await exists(pluginsDir)) {
    const entries = await readdir(pluginsDir);
    const pluginFiles = entries
      .filter((f) => f.endsWith(".ts") || f.endsWith(".js"))
      .sort();

    for (const file of pluginFiles) {
      const pluginPath = join(pluginsDir, file);
      const plugin = await loadPluginModule(pluginPath);
      if (plugin) {
        await plugin.setup(api);
      }
    }
  }
}

async function loadPluginModule(specifier: string): Promise<IcePlugin | null> {
  try {
    const mod = await import(specifier);
    const plugin: IcePlugin = mod.default ?? mod;
    if (typeof plugin.setup !== "function") {
      console.warn(`Plugin "${specifier}" does not export a setup function, skipping.`);
      return null;
    }
    if (!plugin.name) {
      plugin.name = specifier;
    }
    return plugin;
  } catch (err) {
    console.error(`Failed to load plugin "${specifier}":`, err);
    return null;
  }
}
