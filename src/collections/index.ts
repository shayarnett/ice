import type { Page, Collection, CollectionConfig, IceConfig } from "../types";

export class CollectionManager {
  private collections: Map<string, Collection> = new Map();
  private config: IceConfig;

  constructor(config: IceConfig) {
    this.config = config;
  }

  addPage(page: Page, collectionName: string): void {
    let collection = this.collections.get(collectionName);

    if (!collection) {
      const collConfig: CollectionConfig = this.config.collections[collectionName] ?? {
        directory: collectionName,
        permalink: this.config.permalink,
      };

      collection = {
        name: collectionName,
        config: collConfig,
        pages: [],
      };
      this.collections.set(collectionName, collection);
    }

    collection.pages.push(page);
    this.sortCollection(collection);
  }

  getCollection(name: string): Collection {
    return (
      this.collections.get(name) ?? {
        name,
        config: this.config.collections[name] ?? {
          directory: name,
          permalink: this.config.permalink,
        },
        pages: [],
      }
    );
  }

  getAllCollections(): Record<string, Collection> {
    const result: Record<string, Collection> = {};
    for (const [name, collection] of this.collections) {
      result[name] = collection;
    }
    return result;
  }

  private sortCollection(collection: Collection): void {
    const sortField = collection.config.sort;

    if (sortField) {
      const desc = sortField.startsWith("-");
      const field = desc ? sortField.slice(1) : sortField;

      collection.pages.sort((a, b) => {
        const aVal = a.data[field];
        const bVal = b.data[field];

        if (aVal instanceof Date && bVal instanceof Date) {
          return desc
            ? bVal.getTime() - aVal.getTime()
            : aVal.getTime() - bVal.getTime();
        }

        const aStr = String(aVal ?? "");
        const bStr = String(bVal ?? "");
        return desc ? bStr.localeCompare(aStr) : aStr.localeCompare(bStr);
      });
    } else {
      // Default: sort by date descending
      collection.pages.sort((a, b) => {
        const aDate = a.data.date instanceof Date ? a.data.date.getTime() : 0;
        const bDate = b.data.date instanceof Date ? b.data.date.getTime() : 0;
        return bDate - aDate;
      });
    }
  }
}

export { buildPostsCollection, parsePostFilename } from "./posts";
export { expandPagination } from "./pagination";
export { buildTaxonomyPages } from "./taxonomy";
