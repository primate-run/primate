import app from "#app";
import BlogEntry from "#view/BlogEntry";
import type { Component } from "@primate/markdown";
import response from "primate/response";
import route from "primate/route";

export default route({
  async get(request) {
    const entry = request.path.get("entry");
    const { html, meta } = app.views.get<Component>(`docs/blog/${entry}.md`);

    return response.view(BlogEntry, { html, meta });
  },
});
