---
title: Assets
layout: default
---

# Assets

Ice includes an asset pipeline for CSS processing, content-hash fingerprinting, and minification.

## Asset Directory

Place static assets in the `assets/` directory:

```
assets/
  css/
    main.css
  js/
    app.js
  images/
    logo.png
```

Everything in `assets/` is copied to `_site/assets/` during the build.

## CSS Minification

Enable CSS minification in your config:

```ts
export default {
  assets: {
    minify: true,
  },
};
```

When enabled, all `.css` files are minified during the build.

## Fingerprinting

Content-hash fingerprinting appends a hash to asset filenames for cache busting:

```ts
export default {
  assets: {
    fingerprint: true,
  },
};
```

This transforms `assets/css/main.css` into something like `assets/css/main-a1b2c3d4.css`.

### Using Fingerprinted Assets

Use the `asset_url` filter in templates to resolve the correct filename:

{% raw %}
```liquid
<link rel="stylesheet" href="{{ "css/main.css" | asset_url }}">
<script src="{{ "js/app.js" | asset_url }}"></script>
<img src="{{ "images/logo.png" | asset_url }}">
```
{% endraw %}

The filter reads the asset manifest generated during the build and returns the fingerprinted path. If fingerprinting is disabled, it returns the original path with `baseUrl` prepended.

## URL Filters

Ice provides filters for building correct URLs:

{% raw %}
```liquid
<!-- Prepends baseUrl -->
{{ page.url | relative_url }}    → /ice/about/

<!-- Prepends site.url + baseUrl -->
{{ page.url | absolute_url }}    → https://example.com/ice/about/

<!-- Resolves fingerprinted asset -->
{{ "css/main.css" | asset_url }} → /ice/assets/css/main-a1b2c3d4.css
```
{% endraw %}
