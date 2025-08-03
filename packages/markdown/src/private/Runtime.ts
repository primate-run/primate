import type Component from "#Component";
import FrontendModule from "@primate/core/frontend/Module";
import maybe from "@rcompat/assert/maybe";
import type MaybePromise from "@rcompat/type/MaybePromise";
import type UnknownFunction from "@rcompat/type/UnknownFunction";
import type { MarkedExtension } from "marked";
import { marked } from "marked";
import pema from "pema";
import boolean from "pema/boolean";
import pure from "pema/pure";
import string from "pema/string";

function render(component: Component) {
  return { body: component.html };
}

type Pretransform = (text: string) => MaybePromise<string>;

export default class Runtime extends FrontendModule<Component> {
  name = "markdown";
  defaultExtension = ".md";
  layouts = false;
  client = false;
  render = render;
  #pretransform: Pretransform;

  static schema = pema({
    extension: string.optional(),
    marked: pure<MarkedExtension>().optional(),
    pretransform: pure<Pretransform>().optional(),
    spa: boolean.default(true),
    ssr: boolean.default(true),
  });

  static options = Runtime.schema.infer;
  static input = Runtime.schema.input;

  constructor(config: typeof Runtime.input = {}) {
    const { marked: markedOptions, pretransform, ...superConfig } = config;
    super(superConfig);

    maybe(markedOptions).object();
    maybe(pretransform).function();

    this.#pretransform = (pretransform ?? ((m: string) => m)) as Pretransform;

    const renderer = { ...markedOptions?.renderer ?? {} };
    marked.use({ ...markedOptions, renderer });
  }

  get pretransform() {
    return this.#pretransform;
  }
}
