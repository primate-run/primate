import app from "#app";
import BlogEntry from "#view/BlogEntry";
import type Component from "@primate/markdown/Component";
import response from "primate/response";
import route from "primate/route";

route.get(async request => {
  const entry = request.path.get("entry");
  const { html, meta } = app.view<Component>(`docs/blog/${entry}.md`);
  return response.view(BlogEntry, { content: html, meta }, {
    placeholders: request.get("placeholders"),
  });
});
