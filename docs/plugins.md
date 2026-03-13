---
title: Plugins
layout: default
---

# Plugins

Plugins extend Ice with custom behavior using lifecycle hooks, filters, tags, and virtual pages.

## Writing a Plugin

Create a TypeScript file in `_plugins/` — it will be auto-loaded:

```ts
// _plugins/my-plugin.ts
import type { IcePlugin } from "ice-ssg";

const myPlugin: IcePlugin = {
  name: "my-plugin",
  setup(api) {
    // Your plugin logic here
  },
};

export default myPlugin;
```

## Plugin API

The `api` object passed to `setup()` provides these methods:

### `api.on(hook, callback)`

Register a lifecycle hook handler:

```ts
api.on("beforeBuild", async (ctx) => {
  console.log("Build starting...");
});

api.on("afterRender", async (ctx) => {
  console.log(`Rendered ${ctx.pages.length} pages`);
});
```

### `api.addFilter(name, fn)`

Register a custom Liquid filter:

```ts
api.addFilter("shout", (str) => String(str).toUpperCase() + "!");
```

Use in templates:

{% raw %}
```liquid
{{ "hello" | shout }}  → HELLO!
```
{% endraw %}

### `api.addPage(page)`

Inject a virtual page into the build:

```ts
api.addPage({
  url: "/generated/",
  content: "<h1>Generated Page</h1>",
  data: { title: "Generated", layout: "default" },
});
```

### `api.addGlobalData(key, value)`

Add data accessible as `site.<key>` in all templates:

```ts
api.addGlobalData("buildTime", new Date().toISOString());
```

## Lifecycle Hooks

Hooks fire at specific points in the build pipeline:

| Hook | When | Use Case |
|------|------|----------|
| `beforeBuild` | Before anything runs | Setup, validation |
| `afterDiscover` | After files are found | Add/remove pages |
| `beforeRender` | Before page rendering | Transform content |
| `afterRender` | After page rendering | Post-process HTML |
| `beforeWrite` | Before writing to disk | Modify output paths |
| `afterWrite` | After writing to disk | Copy extra files |
| `afterBuild` | Build complete | Cleanup, reporting |
| `beforeServe` | Before dev server starts | Register middleware |

## Built-in Plugins

Ice ships with built-in plugins that are always active:

### Feed Plugin

Generates RSS/Atom and JSON feeds based on your `feeds` config:

```ts
feeds: {
  atom: { path: "/feed.xml", collection: "posts", limit: 20 },
  json: { path: "/feed.json", collection: "posts", limit: 20 },
}
```

### Taxonomy Plugin

Generates tag and category index pages based on your `taxonomies` config.

## Loading External Plugins

Reference npm packages or local paths in your config:

```ts
export default {
  plugins: [
    "ice-plugin-sitemap",       // npm package
    "./_plugins/my-plugin.ts",  // local file
  ],
};
```
