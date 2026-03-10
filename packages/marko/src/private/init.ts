import type { Init } from "@primate/core/frontend";
import type { Renderable } from "marko/src/runtime/html/Template.js";

const module: Init<Renderable> = {
  name: "marko",
  extensions: [".marko"],
  layouts: false,
  client: false,
  render(component, props) {
    return { body: component.renderToString(props) };
  },
};

export default module;
