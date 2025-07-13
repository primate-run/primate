import Module from "@primate/core/frontend/Module";
import type Render from "@primate/core/frontend/Render";
import { createSSRApp, type Renderer } from "vue";
import { renderToString } from "vue/server-renderer";

export default class VueRuntime extends Module<Renderer> {
  name = "vue";
  defaultExtension = ".vue";
  layouts = false;
  client = false;
  render: Render<Renderer> = async (component, props) => {
    const app = createSSRApp({ render: component.render, data: () => props });
    return { body: await renderToString(app) };
  };
};
