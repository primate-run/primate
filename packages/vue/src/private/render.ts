import render_root from "#render-root";
import type Dict from "@rcompat/type/Dict";
import { createSSRApp, type Renderer } from "vue";
import { renderToString } from "vue/server-renderer";

export default async (component: Renderer, props: Dict) => {
  const rootComponent = render_root(component, props);
  const app = createSSRApp(rootComponent);

  const html = await renderToString(app);

  return { body: `<div id="app">${html}</div>` };
};
