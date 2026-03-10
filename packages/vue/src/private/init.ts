import type { Init } from "@primate/core/frontend";
import { createSSRApp, type Renderer } from "vue";
import { renderToString } from "vue/server-renderer";

const module: Init<Renderer> = {
  name: "vue",
  extensions: [".vue"],
  layouts: true,
  client: true,
  async render(view, props) {
    const app = createSSRApp(view, { p: { ...props } });
    const html = await renderToString(app);
    return { body: `<div id="app">${html}</div>` };
  },
};

export default module;
