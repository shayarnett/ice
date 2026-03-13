declare module "droplet" {
  export default class Droplet {
    constructor();
    registerFilter(name: string, fn: (...args: any[]) => unknown): void;
    registerTag(name: string, fn: unknown): void;
    parseAndRender(template: string, context: Record<string, unknown>): Promise<string>;
  }
}
