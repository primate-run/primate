import FrontendModule from "@primate/core/frontend/Module";
import type Render from "@primate/core/frontend/Render";
import { createSSRApp, type Renderer } from "vue";
import { renderToString } from "vue/server-renderer";

export default class Runtime extends FrontendModule<Renderer> {
  name = "vue";
  defaultExtensions = [".vue"];
  layouts = true;
  client = true;
  render: Render<Renderer> = async (component, props) => {
    const app = createSSRApp(component, { p: { ...props } });
    const html = await renderToString(app);
    return { body: `<div id="app">${html}</div>` };
  };
};
