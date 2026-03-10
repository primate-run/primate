import type { Init } from "@primate/core/frontend";
import runtime from "handlebars/runtime.js";

const module: Init = {
  name: "handlebars",
  extensions: [".hbs"],
  layouts: false,
  client: false,
  render(component, props) {
    return { body: (runtime as any).template(component)(props) };
  },
};

export default module;
