// ── Public API ──────────────────────────────────────────────────────

// Config
export { loadConfig } from "./config";

// Types
export type {
  IceConfig,
  Page,
  PageData,
  PostPage,
  Collection,
  CollectionConfig,
  Paginator,
  PaginationFrontmatter,
  SiteContext,
  TemplateContext,
  IcePlugin,
  IcePluginAPI,
  HookName,
  HookCallback,
  HookContext,
  AssetManifest,
  CacheEntry,
  CacheManifest,
  DiscoveredFile,
  FileType,
  TaxonomyConfig,
  FeedConfig,
} from "./types";

// Plugin system
export { HookSystem } from "./plugins/hooks";
export { PluginAPI } from "./plugins/api";
export { loadPlugins } from "./plugins/loader";

// Assets
export { processAssets } from "./assets/pipeline";
export { AssetManifestManager } from "./assets/manifest";

// Server
export { startServer } from "./server/index";
export { LiveReloadServer } from "./server/livereload";

// Core
export { Engine } from "./core/engine";
export { discoverFiles } from "./core/discovery";
export { parseFrontmatter } from "./core/frontmatter";

// Template
export { TemplateEngine } from "./template/engine";

// Collections
export { buildPostsCollection, parsePostFilename } from "./collections/posts";
