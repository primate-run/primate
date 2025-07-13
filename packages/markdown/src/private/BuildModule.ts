import BuildModule from "@primate/core/frontend/BuildModule";
import maybe from "@rcompat/assert/maybe";
import { marked, type MarkedExtension } from "marked";

export default class BuildMarkdown extends BuildModule {
  name = "markdown";
  defaultExtension = ".md";
  compile = {
    server: async (text: string) =>
      `export default () => ${JSON.stringify(await marked.parse(text))};`,
  };

  constructor(extension?: string, options?: MarkedExtension) {
    super(extension);

    maybe(options).object();

    const renderer = { ...options?.renderer ?? {} };
    marked.use({ ...options, renderer });
  }
}
