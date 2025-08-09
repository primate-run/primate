import type Component from "@primate/markdown/Component";
import route from "primate/route";
import view from "primate/view";

route.get(request => {
  const page = request.path.page;

  return async (app) => {
    const { html, toc } = app.component<Component>(`content/docs/${page}.md`);
    const props = {
      app: request.config,
      content: html,
      path: "/" + request.url.pathname.slice("/docs/".length),
      toc,
    };
    return view("Static.svelte", props, {
      placeholders: request.placeholders,
    })(app, {}, request);
  };
});
