import type Component from "@primate/markdown/Component";
import response from "primate/response";
import route from "primate/route";

route.get(request => {
  const guide = request.path.get("guide");

  return async (app) => {
    const { html, meta } = app.loadView<Component>(`content/guides/${guide}.md`);
    const props = {
      app: request.config,
      category: guide.split("/")[0],
      content: html,
      meta,
    };
    return response.view("Guide.svelte", props, {
      placeholders: request.placeholders,
    })(app, {}, request);
  };
});
