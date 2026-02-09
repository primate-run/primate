import app from "#app";
import Guide from "#view/Guide";
import type Component from "@primate/markdown/Component";
import response from "primate/response";
import route from "primate/route";

route.get(request => {
  const guide = request.path.get("guide");
  const { html, meta } = app.view<Component>(`docs/guides/${guide}.md`);
  const props = {
    category: guide.split("/")[0],
    content: html,
    meta,
  };
  return response.view(Guide, props, {
    placeholders: request.get("placeholders"),
  });
});
