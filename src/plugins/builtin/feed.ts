import { join, dirname } from "path";
import { mkdir, writeFile } from "fs/promises";
import type { IcePlugin, Page, FeedConfig } from "../../types";

const feedPlugin: IcePlugin = {
  name: "ice:feed",

  setup(api) {
    const config = api.getConfig();

    if (Object.keys(config.feeds).length === 0) return;

    api.on("afterRender", async (ctx) => {
      for (const [name, feedConfig] of Object.entries(config.feeds)) {
        const collection = ctx.site.collections[feedConfig.collection];
        const pages = collection?.pages ?? [];
        const items = feedConfig.limit ? pages.slice(0, feedConfig.limit) : pages;

        const ext = feedConfig.path.endsWith(".json") ? "json" : "xml";
        const output =
          ext === "json"
            ? generateJsonFeed(config.title, config.url, items)
            : generateAtomFeed(config.title, config.url, items);

        const outPath = join(config.outDir, feedConfig.path);
        await mkdir(dirname(outPath), { recursive: true });
        await writeFile(outPath, output, "utf-8");
      }
    });
  },
};

function generateAtomFeed(title: string, siteUrl: string, items: Page[]): string {
  const updated = items[0]?.data.date
    ? new Date(items[0].data.date).toISOString()
    : new Date().toISOString();

  const entries = items
    .map((page) => {
      const date = page.data.date
        ? new Date(page.data.date).toISOString()
        : new Date().toISOString();
      const url = `${siteUrl}${page.url}`;
      return `  <entry>
    <title>${escapeXml(page.data.title ?? "Untitled")}</title>
    <link href="${escapeXml(url)}"/>
    <id>${escapeXml(url)}</id>
    <updated>${date}</updated>
    <summary>${escapeXml(page.excerpt)}</summary>
    <content type="html">${escapeXml(page.content)}</content>
  </entry>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>${escapeXml(title)}</title>
  <link href="${escapeXml(siteUrl)}/"/>
  <updated>${updated}</updated>
  <id>${escapeXml(siteUrl)}/</id>
${entries}
</feed>
`;
}

function generateJsonFeed(title: string, siteUrl: string, items: Page[]): string {
  const feed = {
    version: "https://jsonfeed.org/version/1.1",
    title,
    home_page_url: siteUrl,
    feed_url: `${siteUrl}/feed.json`,
    items: items.map((page) => ({
      id: `${siteUrl}${page.url}`,
      url: `${siteUrl}${page.url}`,
      title: page.data.title ?? "Untitled",
      content_html: page.content,
      summary: page.excerpt,
      date_published: page.data.date
        ? new Date(page.data.date).toISOString()
        : undefined,
    })),
  };
  return JSON.stringify(feed, null, 2);
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export default feedPlugin;
