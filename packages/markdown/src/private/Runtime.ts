import type InputArgs from "#InputArgs";
import Module from "@primate/core/frontend/Module";
import maybe from "@rcompat/assert/maybe";
import { marked } from "marked";

export default class MarkdownRuntime extends Module {
  name = "markdown";
  defaultExtension = ".md";
  layouts = false;
  client = false;

  constructor(...args: InputArgs) {
    super(args[0]);

    maybe(args[1]).object();

    const renderer = { ...args[1]?.renderer ?? {} };
    marked.use({ ...args[1], renderer });
  }
}
