import Module from "@primate/core/frontend/Module";
import maybe from "@rcompat/assert/maybe";
import type { MarkedExtension } from "marked";
import { marked } from "marked";
import pema from "pema";
import boolean from "pema/boolean";
import pure from "pema/pure";
import string from "pema/string";

export default class Runtime extends Module {
  name = "markdown";
  defaultExtension = ".md";
  layouts = false;
  client = false;

  static schema = pema({
    extension: string.optional(),
    marked: pure<MarkedExtension>().optional(),
    spa: boolean.default(true),
    ssr: boolean.default(true),
  });

  static options = Runtime.schema.infer;
  static input = Runtime.schema.input;

  constructor(config: typeof Runtime.input = {}) {
    const { marked: markedOptions, ...superConfig } = config;
    super(superConfig);

    maybe(markedOptions).object();

    const renderer = { ...markedOptions?.renderer ?? {} };
    marked.use({ ...markedOptions, renderer });
  }
}
