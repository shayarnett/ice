---
title: Getting Started
layout: default
---

# Getting Started

## Prerequisites

Ice requires [Bun](https://bun.sh) v1.0 or later.

```bash
# Install Bun (macOS / Linux)
curl -fsSL https://bun.sh/install | bash
```

## Create a New Site

Use the `ice new` command to scaffold a project:

```bash
bunx ice-ssg new my-site --template blog
cd my-site
bun install
```

Three built-in templates are available:

| Template | Description |
|----------|-------------|
| `blog` | Full-featured blog with posts, tags, feeds, and deploy workflow |
| `docs` | Documentation site with sidebar navigation |
| `minimal` | Bare-bones starting point |

## Build Your Site

```bash
ice build
```

This runs the full build pipeline and writes output to `_site/`. For faster rebuilds during development, use incremental mode:

```bash
ice build --incremental
```

## Start the Dev Server

```bash
ice serve
```

This builds the site, starts a local server at `http://localhost:4000`, and watches for changes. The browser reloads automatically via WebSocket livereload.

```bash
# Custom port
ice serve --port 8080

# Open browser on start
ice serve --open

# Include draft posts
ice serve --drafts
```

## Project Structure

After scaffolding, your project looks like this:

```
my-site/
  ice.config.ts       # Site configuration
  _layouts/            # Liquid layout templates
  _includes/           # Partial templates
  _posts/              # Blog posts (YYYY-MM-DD-slug.md)
  _data/               # Data files (.yml, .json, .ts)
  assets/              # Static assets
  index.md             # Home page
```

See [Site Structure](../site-structure/) for a detailed explanation of each directory.
