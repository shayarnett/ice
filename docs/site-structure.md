---
title: Site Structure
layout: default
---

# Site Structure

## Directory Conventions

{% raw %}
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
{% endraw %}

## The `_` Prefix

Directories prefixed with `_` are **source artifacts** — they are consumed by the build pipeline but never copied directly to output. Everything else becomes either a page (`.md`, `.html`) or a static asset.

| Directory | Purpose |
|-----------|---------|
| `_layouts/` | Liquid templates that wrap page content |
{% raw %}| `_includes/` | Reusable partials loaded with `{% include %}` or `{% render %}` |{% endraw %}
| `_posts/` | Blog posts, parsed from `YYYY-MM-DD-slug.md` filenames |
| `_data/` | Data files available as `site.data.<filename>` |
| `_plugins/` | Plugin files, auto-loaded at build time |
| `_site/` | Generated output (should be gitignored) |
| `.ice-cache/` | Incremental build cache (should be gitignored) |

## Pages

Any `.md` or `.html` file not inside an `_`-prefixed directory becomes a page. The URL is derived from the file path:

| File | URL |
|------|-----|
| `index.md` | `/` |
| `about.md` | `/about/` |
| `docs/guide.md` | `/docs/guide/` |

Pages use frontmatter to set metadata:

```markdown
---
title: About
layout: default
---

Page content here.
```

## Posts

Posts live in `_posts/` and follow the naming convention `YYYY-MM-DD-slug.md`. The date and slug are extracted from the filename:

```
_posts/2024-01-15-hello-world.md → /blog/2024/01/hello-world/
```

Posts are automatically sorted by date (newest first) with `previous` and `next` links.

## Data Files

Files in `_data/` are loaded and made available in templates as `site.data.<name>`:

| File | Template access |
|------|----------------|
| `_data/nav.yml` | `site.data.nav` |
| `_data/authors.json` | `site.data.authors` |
| `_data/config.ts` | `site.data.config` |

Supported formats: YAML (`.yml`), JSON (`.json`), and TypeScript (`.ts` — must `export default`).

## Layouts

Layouts are Liquid templates in `_layouts/` that wrap page content. A page specifies its layout in frontmatter:

```markdown
---
layout: default
---
```

{% raw %}
Layouts receive the rendered page content as `{{ content }}` and can chain to parent layouts:

```liquid
---
layout: base
---
<article>{{ content }}</article>
```
{% endraw %}

## Custom Collections

Beyond `_posts/`, you can define custom collections in `ice.config.ts`:

```ts
collections: {
  projects: {
    directory: "_projects",
    permalink: "/projects/:slug/",
    sort: "order",
  },
}
```

Each collection directory works like `_posts/` — Markdown files inside it are grouped and accessible as `collections.projects` in templates.
