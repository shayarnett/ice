---
title: Ice
layout: default
---

# Ice

A fast static site generator powered by [Bun](https://bun.sh), [Droplet](https://github.com/shayarnett/droplet) (Liquid templates), and Markdown.

## Features

- **Fast builds** — ~35ms for a typical blog, powered by Bun
- **Markdown + Liquid** — Write content in Markdown, templates in Liquid via Droplet
- **Syntax highlighting** — Shiki-powered code blocks with configurable themes
- **Collections** — Built-in posts collection plus custom collections
- **Pagination** — Opt-in via frontmatter, automatic page generation
- **Taxonomies** — Auto-generated tag and category pages
- **Feeds** — RSS/Atom and JSON Feed generation
- **Asset pipeline** — CSS minification, content-hash fingerprinting
- **Dev server** — Bun.serve with WebSocket livereload
- **Incremental builds** — Content-hash cache with dependency propagation
- **Plugin system** — Lifecycle hooks, custom filters/tags, virtual pages
- **GitHub Pages** — Ships deploy workflow, writes `.nojekyll`

## Quick Start

```bash
# Scaffold a new site
bunx ice-ssg new my-site --template blog

cd my-site
bun install
ice serve
```

Open [http://localhost:4000](http://localhost:4000) and start writing.

## What's Next

- [Getting Started](getting-started/) — Install, scaffold, build, and serve
- [Site Structure](site-structure/) — How Ice organizes your project
- [Configuration](configuration/) — Full config reference
- [Templates](templates/) — Liquid syntax, context variables, and filters
