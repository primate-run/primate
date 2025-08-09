import type Component from "@primate/markdown/Component";
import route from "primate/route";
import view from "primate/view";

route.get(request => {
  const { entry } = request.path;
  return async (app) => {
    const { html, meta } = app.component<Component>(`content/blog/${entry}.md`);
    return view("BlogEntry.svelte", {
      app: request.config,
      content: html,
      meta,
    }, {
      placeholders: request.placeholders,
    })(app, {}, request);
  };
});;
