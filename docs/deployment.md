---
title: Deployment
layout: default
---

# Deployment

## GitHub Pages

Ice is designed for easy deployment to GitHub Pages. The build outputs a `_site/` directory with a `.nojekyll` file (so GitHub doesn't try to process it with Jekyll).

### Setup

1. In your repository settings, go to **Settings → Pages**
2. Under **Source**, select **GitHub Actions**

### baseUrl

For GitHub project pages (repos that aren't `username.github.io`), set `baseUrl` in your config:

```ts
export default {
  url: "https://username.github.io",
  baseUrl: "/repo-name/",
};
```

This ensures all generated links and asset URLs include the correct path prefix.

### GitHub Actions Workflow

Create `.github/workflows/docs.yml` in your repo:

{% raw %}
```yaml
name: Deploy docs

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install
      - run: bun run scripts/patch-droplet.ts
      - run: cd docs && bun run ../src/cli/index.ts build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: docs/_site
      - id: deployment
        uses: actions/deploy-pages@v4
```
{% endraw %}

This workflow:

1. Checks out the repo
2. Installs Bun and dependencies
3. Patches Droplet for ESM compatibility
4. Builds the docs site
5. Uploads the `_site/` directory as a Pages artifact
6. Deploys to GitHub Pages

### Custom Domain

To use a custom domain, add a `CNAME` file to your site root containing your domain:

```
docs.example.com
```

Then update your config:

```ts
export default {
  url: "https://docs.example.com",
  baseUrl: "/",
};
```

## Other Hosts

Ice generates plain static HTML — the `_site/` directory can be deployed anywhere that serves static files: Netlify, Vercel, Cloudflare Pages, S3, or your own server.

```bash
ice build
# Upload _site/ to your host
```
