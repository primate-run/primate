import type { Init } from "@primate/core/frontend";
import type { MaybePromise } from "@rcompat/type";
import type { MarkedExtension } from "marked";
import p from "pema";

type Pretransform = (text: string) => MaybePromise<string>;

const schema = p({
  marked: p.pure<MarkedExtension>().optional(),
  pretransform: p.pure<Pretransform>().optional(),
});

function render(component: { html: string }) {
  return { body: component.html };
}

const init: Init<{ html: string }, typeof schema> = {
  name: "markdown",
  extensions: [".md"],
  layouts: false,
  client: false,
  render,
  schema,
};

export default init;
