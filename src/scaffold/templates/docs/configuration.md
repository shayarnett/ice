---
title: Configuration
layout: default
---

# Configuration

Ice is configured via `ice.config.ts` in your project root.

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `title` | string | `"My Site"` | Site title |
| `url` | string | `"http://localhost:4000"` | Production URL |
| `baseUrl` | string | `"/"` | Base URL path |
| `permalink` | string | `"/blog/:year/:month/:slug/"` | Post permalink pattern |

## Example

```typescript
export default {
  title: "My Docs",
  url: "https://docs.example.com",
  baseUrl: "/",
};
```
