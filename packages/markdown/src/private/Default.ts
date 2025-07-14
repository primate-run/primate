import Runtime from "#Runtime";
import { marked } from "marked";

export default class MarkdownDefault extends Runtime {
  compile = {
    server: async (text: string) =>
      `export default () => ${JSON.stringify(await marked.parse(text))};`,
  };
}
