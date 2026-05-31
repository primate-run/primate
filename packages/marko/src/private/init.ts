import type { Init } from "@primate/core/frontend";
import type { Template } from "marko/src/runtime/html/index.js";

const module: Init<Template> = {
  name: "marko",
  extensions: [".marko"],
  conditions: ["marko"],
  layouts: true,
  client: true,
  async render(component, props) {
    return { body: (await component.render(props)).toString() };
  },
};

export default module;
