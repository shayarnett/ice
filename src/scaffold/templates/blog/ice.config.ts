export default {
  title: "My Blog",
  url: "https://example.com",
  baseUrl: "/",
  permalink: "/blog/:year/:month/:slug/",

  collections: {
    posts: {
      directory: "_posts",
      permalink: "/blog/:year/:month/:slug/",
      sort: "date:desc",
    },
  },

  taxonomies: {
    tags: { permalink: "/tags/:tag/" },
    categories: { permalink: "/categories/:category/" },
  },

  feeds: {
    atom: { path: "/feed.xml", collection: "posts", limit: 20 },
    json: { path: "/feed.json", collection: "posts", limit: 20 },
  },

  pagination: { perPage: 10 },

  assets: {
    fingerprint: false,
    minify: true,
  },

  serve: {
    port: 4000,
    livereload: true,
  },

  plugins: [],
};
