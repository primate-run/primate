import type { Init } from "@primate/core/frontend";
import type { Template } from "marko/src/runtime/html/index.js";

const module: Init<Template> = {
  name: "marko",
  extensions: [".marko"],
  layouts: false,
  client: false,
  async render(component, props) {
    return { body: (await component.render(props)).toString() };
  },
};

export default module;
