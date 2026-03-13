---
title: Collections
layout: default
---

# Collections

Collections group related content together. Ice has a built-in `posts` collection and supports custom collections.

## Posts

The `_posts/` directory is a built-in collection. Files must follow the naming convention:

```
YYYY-MM-DD-slug.md
```

Example:

```
_posts/
  2024-01-15-hello-world.md
  2024-02-20-second-post.md
  2024-03-10-ice-launch.md
```

Posts are sorted by date (newest first) and each has automatic `previous` and `next` links.

### Post Frontmatter

```markdown
---
title: "Hello World"
layout: post
tags: [intro, hello]
categories: [general]
draft: true          # Excluded unless --drafts flag is used
---

Your content here.
```

### Accessing Posts

In templates, all posts are available via `site.posts`:

{% raw %}
```liquid
{% for post in site.posts %}
  <article>
    <h2><a href="{{ post.url }}">{{ post.data.title }}</a></h2>
    <time>{{ post.data.date | date: "%B %d, %Y" }}</time>
    <p>{{ post.excerpt }}</p>
  </article>
{% endfor %}
```
{% endraw %}

## Custom Collections

Define additional collections in `ice.config.ts`:

```ts
export default {
  collections: {
    projects: {
      directory: "_projects",
      permalink: "/projects/:slug/",
      sort: "order",
    },
    recipes: {
      directory: "_recipes",
      permalink: "/recipes/:slug/",
      sort: "date:desc",
    },
  },
};
```

Each collection is accessible in templates as `collections.<name>`:

{% raw %}
```liquid
{% for project in collections.projects %}
  <a href="{{ project.url }}">{{ project.data.title }}</a>
{% endfor %}
```
{% endraw %}

### Collection Options

| Option | Description |
|--------|-------------|
| `directory` | Source directory (e.g. `"_projects"`) |
| `permalink` | URL pattern with `:slug` placeholder |
| `sort` | Field to sort by, with optional `:desc` suffix |

## Pagination

Add pagination to any page via frontmatter:

{% raw %}
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
  <p>{{ post.excerpt }}</p>
{% endfor %}

{% if paginator.previousUrl %}
  <a href="{{ paginator.previousUrl }}">← Newer</a>
{% endif %}
{% if paginator.nextUrl %}
  <a href="{{ paginator.nextUrl }}">Older →</a>
{% endif %}

<p>Page {{ paginator.page }} of {{ paginator.totalPages }}</p>
```
{% endraw %}

Ice generates pages automatically: `/blog/`, `/blog/page/2/`, `/blog/page/3/`, etc.

### Paginator Fields

| Field | Description |
|-------|-------------|
| `paginator.items` | Items on the current page |
| `paginator.page` | Current page number (1-indexed) |
| `paginator.totalPages` | Total page count |
| `paginator.totalItems` | Total item count |
| `paginator.previousUrl` | Previous page URL or nil |
| `paginator.nextUrl` | Next page URL or nil |

## Taxonomies

Taxonomies group posts by metadata fields. The built-in taxonomies are `tags` and `categories`:

```ts
export default {
  taxonomies: {
    tags: { permalink: "/tags/:tag/" },
    categories: { permalink: "/categories/:category/" },
  },
};
```

Ice automatically generates a page for each unique tag and category. In templates:

{% raw %}
```liquid
{% for tag, posts in site.tags %}
  <h2>{{ tag }}</h2>
  {% for post in posts %}
    <a href="{{ post.url }}">{{ post.data.title }}</a>
  {% endfor %}
{% endfor %}
```
{% endraw %}
