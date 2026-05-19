import app from "#app";
import Static from "#view/Static";
import type { Component } from "@primate/markdown";
import response from "primate/response";
import route from "primate/route";

export default route({
  async get(request) {
    const page = request.path.get("page");
    const markdown = page.endsWith(".md");
    const id = markdown ? page.slice(0, -".md".length) : page;

    const { html, toc, md } = app.views.get<Component>(`docs/docs/${id}.md`);

    if (markdown) return response.text(md);

    const props = {
      content: html,
      path: "/" + request.url.pathname.slice("/docs/".length),
      toc,
    };

    return response.view(Static, props);
  },
});
