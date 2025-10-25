import type Component from "@primate/markdown/Component";
import response from "primate/response";
import route from "primate/route";

route.get(request => {
  const entry = request.path.get("entry");
  return async (app) => {
    const { html, meta } = app.loadView<Component>(`content/blog/${entry}.md`);
    return response.view("BlogEntry.svelte", {
      app: request.config,
      content: html,
      meta,
    }, {
      placeholders: request.placeholders,
    })(app, {}, request);
  };
});;
