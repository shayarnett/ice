# Ice

A fast static site generator powered by [Bun](https://bun.sh), [Droplet](https://github.com/shayarnett/droplet) (Liquid templates), and Markdown.

## Quick Start

```bash
# Scaffold a new site
bunx ice-ssg new my-site --template blog

cd my-site
bun install
ice serve
```

Open [http://localhost:4000](http://localhost:4000) and start writing.

## Features

- **Fast builds** — ~35ms for a typical blog, powered by Bun
- **Markdown + Liquid** — Write content in Markdown, templates in Liquid (via Droplet)
- **Syntax highlighting** — Shiki-powered code blocks with configurable themes
- **Collections** — Built-in posts collection + custom collections
- **Pagination** — Opt-in via frontmatter, automatic page generation
- **Taxonomies** — Auto-generated tag and category pages
- **Feeds** — RSS/Atom and JSON Feed generation
- **Asset pipeline** — CSS minification, content-hash fingerprinting
- **Dev server** — Bun.serve with WebSocket livereload
- **Incremental builds** — Content-hash cache with dependency propagation
- **Plugin system** — Lifecycle hooks, custom filters/tags, virtual pages
- **GitHub Pages** — Ships deploy workflow, writes `.nojekyll`

## Site Structure

```
my-site/
  ice.config.ts          # Site configuration
  _layouts/              # Liquid layout templates
  _includes/             # Partials ({% include "nav.liquid" %})
  _posts/                # Blog posts: YYYY-MM-DD-slug.md
  _data/                 # Data files (.yml, .json, .ts) → site.data.*
  _plugins/              # User plugins, auto-loaded
  assets/                # Static assets (css/, js/, images/)
  _site/                 # Build output (gitignored)
  index.md               # Pages — any .md/.html at root or in subdirs
  404.md
```

Directories prefixed with `_` are source artifacts and won't be copied to output. Everything else becomes a page or is copied as a static asset.

## CLI

```bash
ice build                    # Full production build
ice build --incremental      # Only rebuild changed pages
ice build --drafts           # Include draft posts
ice build --profile          # Print per-stage timing

ice serve                    # Dev server with livereload
ice serve --port 8080        # Custom port
ice serve --open             # Open browser on start

ice new my-site              # Scaffold with blog template
ice new docs --template docs # Use docs or minimal template

ice clean                    # Remove _site/ and .ice-cache/
```

## Configuration

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

All fields are optional — sensible defaults are applied.

## Posts

Create posts in `_posts/` using the naming convention `YYYY-MM-DD-slug.md`:

```markdown
---
title: "Hello World"
layout: post
tags: [intro, hello]
categories: [general]
---

Your content here. **Markdown** is fully supported.
```

Posts are sorted by date (newest first) with automatic previous/next links.

## Pagination

Add pagination to any page via frontmatter:

```markdown
---
title: Blog
layout: default
pagination:
  collection: posts
  perPage: 5
---

{% for post in paginator.items %}
  <h2><a href="{{ post.url }}">{{ post.data.title }}</a></h2>
{% endfor %}

Page {{ paginator.page }} of {{ paginator.totalPages }}
```

## Template Context

| Variable      | Contents |
|---------------|----------|
| `site`        | Config values + `data`, `pages`, `posts`, `tags`, `categories`, `time` |
| `page`        | Frontmatter fields + `url`, `content`, `excerpt`, `previous`, `next` |
| `content`     | Rendered inner content (available in layouts) |
| `collections` | All collections by name |
| `paginator`   | Pagination state (on paginated pages only) |

### Filters

| Filter | Example | Description |
|--------|---------|-------------|
| `asset_url` | `{{ "css/main.css" \| asset_url }}` | Resolves fingerprinted asset path |
| `absolute_url` | `{{ page.url \| absolute_url }}` | Prepends `site.url + baseUrl` |
| `relative_url` | `{{ page.url \| relative_url }}` | Prepends `baseUrl` |
| `markdownify` | `{{ page.description \| markdownify }}` | Renders Markdown to HTML |
| `slugify` | `{{ page.title \| slugify }}` | URL-safe slug |
| `reading_time` | `{{ page.content \| reading_time }}` | "3 min read" |
| `date_to_xmlschema` | `{{ page.date \| date_to_xmlschema }}` | ISO 8601 date |
| `xml_escape` | `{{ page.title \| xml_escape }}` | Escapes XML entities |
| `json` | `{{ site.data \| json }}` | JSON.stringify |

## Plugins

```ts
// _plugins/my-plugin.ts
import type { IcePlugin } from "ice-ssg";

const myPlugin: IcePlugin = {
  name: "my-plugin",
  setup(api) {
    // Lifecycle hooks
    api.on("beforeBuild", async (ctx) => { /* ... */ });
    api.on("afterRender", async (ctx) => { /* ... */ });

    // Custom filter
    api.addFilter("shout", (str) => String(str).toUpperCase() + "!");

    // Virtual page
    api.addPage({
      url: "/generated/",
      content: "<h1>Generated</h1>",
      data: { title: "Generated Page", layout: "default" },
    });

    // Global data
    api.addGlobalData("buildTime", new Date().toISOString());
  },
};

export default myPlugin;
```

**Hooks:** `beforeBuild`, `afterDiscover`, `beforeRender`, `afterRender`, `beforeWrite`, `afterWrite`, `afterBuild`, `beforeServe`

## GitHub Pages

The `blog` scaffold template includes `.github/workflows/deploy.yml` that deploys to GitHub Pages on push to `main`. It uses `actions/upload-pages-artifact` + `actions/deploy-pages`.

For project pages (not `username.github.io`), set `baseUrl` in your config:

```ts
export default {
  baseUrl: "/my-repo/",
};
```

## Build Pipeline

```
INIT → DISCOVER → CLASSIFY → DATA → PARSE → COLLECTIONS → PAGINATION → RENDER → FEEDS → ASSETS → WRITE → DONE
```

Each stage emits a lifecycle hook. Per-page rendering: **Markdown → HTML → Liquid → Layout chain**.

## Dependencies

| Package | Purpose |
|---------|---------|
| [Droplet](https://github.com/shayarnett/droplet) | Liquid templating |
| [markdown-it](https://github.com/markdown-it/markdown-it) | Markdown → HTML |
| [shiki](https://shiki.style) | Syntax highlighting |
| [gray-matter](https://github.com/jonschlinkert/gray-matter) | Frontmatter parsing |
| [yaml](https://github.com/eemeli/yaml) | YAML data file parsing |

## License

MIT
