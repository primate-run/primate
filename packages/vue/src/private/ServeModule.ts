import type Render from "@primate/core/frontend/Render";
import ServeModule from "@primate/core/frontend/ServeModule";
import { createSSRApp, type Renderer } from "vue";
import { renderToString } from "vue/server-renderer";

export default class ServeVue extends ServeModule<Renderer> {
  name = "vue";
  root = false;
  render: Render<Renderer> = async (component, props) => {
    const app = createSSRApp({ render: component.render, data: () => props });
    return { body: await renderToString(app) };
  };
};
