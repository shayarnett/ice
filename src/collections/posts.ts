import type { Page, PostPage, IceConfig } from "../types";
import { posix } from "path";

const POST_FILENAME_RE = /^(\d{4})-(\d{2})-(\d{2})-(.+)\.md$/;

export function parsePostFilename(
  filename: string,
): { date: Date; slug: string } | null {
  const match = POST_FILENAME_RE.exec(filename);
  if (!match) return null;

  const [, year, month, day, slug] = match;
  return {
    date: new Date(`${year}-${month}-${day}T00:00:00`),
    slug,
  };
}

export function buildPostsCollection(
  pages: Page[],
  config: IceConfig,
): PostPage[] {
  const pattern =
    config.collections.posts?.permalink ?? config.permalink;

  const posts: PostPage[] = pages.map((page) => {
    const date = page.data.date ?? new Date(0);
    const slug =
      (page.data.slug as string | undefined) ??
      posix.basename(page.relativePath).replace(/\.md$/, "").replace(/^\d{4}-\d{2}-\d{2}-/, "");

    const url = resolvePermalink(pattern, date, slug);

    return {
      ...page,
      url,
      data: { ...page.data, date, slug },
    } as PostPage;
  });

  // Sort by date descending (newest first)
  posts.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

  // Build prev/next links
  for (let i = 0; i < posts.length; i++) {
    if (i > 0) posts[i].next = posts[i - 1];
    if (i < posts.length - 1) posts[i].previous = posts[i + 1];
  }

  return posts;
}

function resolvePermalink(pattern: string, date: Date, slug: string): string {
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return pattern
    .replace(/:year/g, year)
    .replace(/:month/g, month)
    .replace(/:day/g, day)
    .replace(/:slug/g, slug);
}
