---
title: Deployment
layout: default
---

# Deployment

## Build for Production

```bash
bun run build
```

The output will be in the `_site/` directory.

## GitHub Pages

Add the included GitHub Actions workflow to deploy automatically on push to `main`.

## Other Hosts

Upload the `_site/` directory to any static hosting provider:

- Netlify
- Vercel
- Cloudflare Pages
- AWS S3 + CloudFront
