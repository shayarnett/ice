---
title: Home
layout: default
pagination:
  collection: posts
  perPage: 10
---

# Latest Posts

{% for post in paginator.items %}
<article class="post-preview">
  <h2><a href="{{ post.url }}">{{ post.data.title }}</a></h2>
  <time datetime="{{ post.data.date | date_to_xmlschema }}">{{ post.data.date | date: "%B %d, %Y" }}</time>
  <p>{{ post.excerpt }}</p>
</article>
{% endfor %}

{% if paginator.totalPages > 1 %}
<nav class="pagination">
  {% if paginator.previousUrl %}
    <a href="{{ paginator.previousUrl }}">&larr; Newer</a>
  {% endif %}
  <span>Page {{ paginator.page }} of {{ paginator.totalPages }}</span>
  {% if paginator.nextUrl %}
    <a href="{{ paginator.nextUrl }}">Older &rarr;</a>
  {% endif %}
</nav>
{% endif %}
