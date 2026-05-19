import app from "#app";
import Guide from "#view/Guide";
import type { Component } from "@primate/markdown";
import response from "primate/response";
import route from "primate/route";

export default route({
  async get(request) {
    const guide = request.path.get("guide");
    const { html, meta } = app.views.get<Component>(`docs/guides/${guide}.md`);

    const props = { category: guide.split("/")[0], html, meta };

    return response.view(Guide, props);
  },
});
