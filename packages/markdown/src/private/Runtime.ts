import type Component from "#Component";
import FrontendModule from "@primate/core/frontend/Module";
import assert from "@rcompat/assert";
import type { MaybePromise } from "@rcompat/type";
import type { MarkedExtension } from "marked";
import { marked } from "marked";
import p from "pema";

function render(component: Component) {
  return { body: component.html };
}

type Pretransform = (text: string) => MaybePromise<string>;

export default class Runtime extends FrontendModule<Component> {
  name = "markdown";
  defaultExtensions = [".md"];
  layouts = false;
  client = false;
  render = render;
  #pretransform: Pretransform;

  static schema = p({
    fileExtensions: p.array(p.string).optional(),
    marked: p.pure<MarkedExtension>().optional(),
    pretransform: p.pure<Pretransform>().optional(),
    spa: p.boolean.default(true),
    ssr: p.boolean.default(true),
  });

  static options = Runtime.schema.infer;
  static input = Runtime.schema.input;

  constructor(config: typeof Runtime.input = {}) {
    const { marked: marked_options, pretransform, ...super_config } = config;
    super(super_config);

    assert.maybe.dict(marked_options);
    assert.maybe.function(pretransform);

    this.#pretransform = (pretransform ?? ((m: string) => m)) as Pretransform;

    const renderer = { ...marked_options?.renderer ?? {} };
    marked.use({ ...marked_options, renderer });
  }

  get pretransform() {
    return this.#pretransform;
  }
}
