import app from "@/config/app";
import type { Component } from "@primate/markdown";
import response from "primate/response";
import route from "primate/route";

export default route({
  async get(request) {
    const raw_page = request.path.get("page");
    const page = Array.isArray(raw_page) ? raw_page.join("/") : raw_page;
    const markdown = page.endsWith(".md");
    const id = markdown ? page.slice(0, -".md".length) : page;

    const { html, toc, md } = app.views.get<Component>(`docs/docs/${id}.md`);

    if (markdown) return response.text(md);

    return response.view("Static.marko", {
      content: html,
      path: "/" + request.url.pathname.slice("/docs/".length),
      toc,
    });
  },
});
