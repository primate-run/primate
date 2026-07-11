import app from "@/config/app";
import type { Component } from "@primate/markdown";
import response from "primate/response";
import route from "primate/route";

export default route({
  async get(request) {
    const guide = request.path.get("guide");
    const { html, meta } = app.views.get<Component>(`docs/guides/${guide}.md`);

    return response.page({ category: guide.split("/")[0], html, meta });
  },
});
