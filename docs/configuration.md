---
title: Configuration
layout: default
---

# Configuration

Ice is configured via `ice.config.ts` at your site root. All fields are optional — sensible defaults are applied.

## Full Reference

```ts
// ice.config.ts
export default {
  title: "My Site",
  url: "https://example.com",
  baseUrl: "/",                    // "/repo-name/" for GitHub project pages
  permalink: "/blog/:year/:month/:slug/",

  collections: {
    projects: {
      directory: "_projects",
      permalink: "/projects/:slug/",
      sort: "order",
    },
  },

  taxonomies: {
    tags: { permalink: "/tags/:tag/" },
    categories: { permalink: "/categories/:category/" },
  },

  pagination: { perPage: 10 },

  markdown: {
    linkify: true,
    typographer: true,
    highlight: { theme: "github-dark" },
  },

  assets: {
    fingerprint: true,
    minify: true,
  },

  feeds: {
    rss:  { path: "/feed.xml",  collection: "posts", limit: 20 },
    json: { path: "/feed.json", collection: "posts", limit: 20 },
  },

  serve: { port: 4000, livereload: true },

  plugins: ["ice-plugin-sitemap"],
};
```

## Fields

### `title`

Site title, available as `site.title` in templates.

### `url`

Production URL (e.g. `https://example.com`). Used by `absolute_url` filter and feed generation.

### `baseUrl`

Path prefix for all URLs. Set to `"/"` for root deployment or `"/repo-name/"` for GitHub project pages. Affects `relative_url` filter and all generated links.

### `permalink`

Default permalink pattern for posts. Supports these placeholders:

| Placeholder | Value |
|-------------|-------|
| `:year` | Four-digit year from post date |
| `:month` | Two-digit month |
| `:day` | Two-digit day |
| `:slug` | URL slug from filename |
| `:title` | Slugified title |

### `collections`

Define custom collections beyond the built-in `posts`. Each collection needs:

- `directory` — Source directory (e.g. `"_projects"`)
- `permalink` — URL pattern with `:slug` placeholder
- `sort` — (Optional) field to sort by, with optional `:desc` suffix

### `taxonomies`

Configure auto-generated taxonomy pages. Built-in taxonomies are `tags` and `categories`. Each needs a `permalink` with the taxonomy placeholder (`:tag`, `:category`).

### `pagination`

- `perPage` — Number of items per paginated page (default: 10)

### `markdown`

- `linkify` — Auto-link URLs in text
- `typographer` — Smart quotes and dashes
- `highlight.theme` — Shiki theme name for syntax highlighting (e.g. `"github-dark"`, `"one-dark-pro"`)

### `assets`

- `fingerprint` — Append content hash to asset filenames for cache busting
- `minify` — Minify CSS output

### `feeds`

Define RSS/Atom or JSON feeds. Each entry needs:

- `path` — Output path (e.g. `"/feed.xml"`)
- `collection` — Source collection name
- `limit` — (Optional) max number of items

### `serve`

- `port` — Dev server port (default: 4000)
- `livereload` — Enable WebSocket livereload (default: true)

### `plugins`

Array of plugin package names or paths to load.
