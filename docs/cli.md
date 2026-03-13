---
title: CLI
layout: default
---

# CLI

## Commands

### `ice build`

Run a full production build. Output is written to `_site/`.

```bash
ice build
```

| Flag | Description |
|------|-------------|
| `--incremental` | Only rebuild pages that changed (uses content-hash cache) |
| `--drafts` | Include posts with `draft: true` in frontmatter |
| `--profile` | Print per-stage timing breakdown |

### `ice serve`

Build the site and start a dev server with livereload.

```bash
ice serve
```

| Flag | Description |
|------|-------------|
| `--port <n>` | Set the server port (default: 4000) |
| `--open` | Open the browser automatically |
| `--drafts` | Include draft posts |

The server watches for file changes and rebuilds automatically. Connected browsers reload via WebSocket.

### `ice new`

Scaffold a new Ice site from a template.

```bash
ice new my-site
ice new my-site --template docs
```

| Flag | Description |
|------|-------------|
| `--template <name>` | Template to use: `blog` (default), `docs`, or `minimal` |

### `ice clean`

Remove the `_site/` output directory and `.ice-cache/` cache directory.

```bash
ice clean
```

## Build Pipeline

The build runs through these stages in order:

```
INIT → DISCOVER → CLASSIFY → DATA → PARSE →
COLLECTIONS → PAGINATION → RENDER → FEEDS →
ASSETS → WRITE → DONE
```

Use `--profile` to see how long each stage takes. Each stage emits a lifecycle hook that [plugins](../plugins/) can tap into.
