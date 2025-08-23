import type Component from "@primate/markdown/Component";
import view from "primate/response/view";
import route from "primate/route";

route.get(request => {
  const entry = request.path.get("entry");
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
