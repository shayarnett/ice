---
title: Templates
layout: default
---

# Templates

Ice uses [Liquid](https://shopify.github.io/liquid/) templates via [Droplet](https://github.com/shayarnett/droplet). Write layouts and includes with Liquid syntax, and Ice provides a rich set of context variables and filters.

## Liquid Basics

### Output

{% raw %}
```liquid
{{ page.data.title }}
{{ site.title }}
```
{% endraw %}

### Tags

{% raw %}
```liquid
{% if page.data.tags %}
  {% for tag in page.data.tags %}
    <span>{{ tag }}</span>
  {% endfor %}
{% endif %}
```
{% endraw %}

### Includes

Load partials from `_includes/`:

{% raw %}
```liquid
{% include "nav.liquid" %}
{% render "footer.liquid" %}
```
{% endraw %}

## Template Context

Every page has access to these variables:

### `site`

Global site data from your config plus computed fields:

| Field | Description |
|-------|-------------|
| `site.title` | Site title from config |
| `site.url` | Production URL |
| `site.baseUrl` | URL path prefix |
| `site.data` | Merged data files from `_data/` |
| `site.pages` | All pages |
| `site.posts` | All posts (sorted by date) |
| `site.tags` | Posts grouped by tag |
| `site.categories` | Posts grouped by category |
| `site.time` | Build timestamp |

### `page`

Current page metadata:

| Field | Description |
|-------|-------------|
| `page.data.title` | Page title from frontmatter |
| `page.url` | Page URL |
| `page.content` | Rendered page content |
| `page.excerpt` | First paragraph excerpt |
| `page.data.date` | Post date |
| `page.previous` | Previous post (in posts collection) |
| `page.next` | Next post |

Any frontmatter field is accessible under `page.data`.

### `content`

{% raw %}
In layouts, `{{ content }}` holds the rendered inner content — either the page body or the output of a child layout.
{% endraw %}

### `collections`

All collections by name:

{% raw %}
```liquid
{% for project in collections.projects %}
  <a href="{{ project.url }}">{{ project.data.title }}</a>
{% endfor %}
```
{% endraw %}

### `paginator`

Available on pages with pagination frontmatter:

| Field | Description |
|-------|-------------|
| `paginator.items` | Items on this page |
| `paginator.page` | Current page number |
| `paginator.totalPages` | Total number of pages |
| `paginator.totalItems` | Total number of items |
| `paginator.previousUrl` | URL of previous page (or nil) |
| `paginator.nextUrl` | URL of next page (or nil) |

## Filters

### Asset and URL Filters

{% raw %}
| Filter | Example | Result |
|--------|---------|--------|
| `asset_url` | `{{ "css/main.css" \| asset_url }}` | Fingerprinted asset path |
| `absolute_url` | `{{ page.url \| absolute_url }}` | Full URL with domain |
| `relative_url` | `{{ page.url \| relative_url }}` | URL with baseUrl prefix |
{% endraw %}

### Content Filters

{% raw %}
| Filter | Example | Result |
|--------|---------|--------|
| `markdownify` | `{{ page.data.description \| markdownify }}` | Renders Markdown to HTML |
| `slugify` | `{{ page.data.title \| slugify }}` | URL-safe slug |
| `reading_time` | `{{ page.content \| reading_time }}` | "3 min read" |
{% endraw %}

### Format Filters

{% raw %}
| Filter | Example | Result |
|--------|---------|--------|
| `date_to_xmlschema` | `{{ page.data.date \| date_to_xmlschema }}` | ISO 8601 date |
| `xml_escape` | `{{ page.data.title \| xml_escape }}` | XML-safe string |
| `json` | `{{ site.data \| json }}` | JSON string |
{% endraw %}

## Layout Chains

Layouts can inherit from other layouts. A `post` layout can wrap itself in `default`:

{% raw %}
```liquid
---
layout: default
---
<article class="post">
  <h1>{{ page.data.title }}</h1>
  <time>{{ page.data.date | date: "%B %d, %Y" }}</time>
  {{ content }}
</article>
```
{% endraw %}

The rendering pipeline applies layouts from innermost to outermost:

```
page content → markdown → liquid → post layout → default layout
```
