export default {
  title: "Ice",
  url: "https://shayarnett.github.io",
  baseUrl: "/ice/",

  markdown: {
    linkify: true,
    typographer: true,
    highlight: { theme: "github-dark" },
  },

  assets: {
    minify: true,
  },

  serve: { port: 4000, livereload: true },
  plugins: [],
};
