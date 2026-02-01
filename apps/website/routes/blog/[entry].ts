import type Component from "@primate/markdown/Component";
import response from "primate/response";
import route from "primate/route";
import BlogEntry from "#view/BlogEntry";

route.get(request => {
  const entry = request.path.get("entry");
  return async app => {
    const { html, meta } = app.loadView<Component>(`docs/blog/${entry}.md`);
    return response.view(BlogEntry, { content: html, meta }, {
      placeholders: request.get("placeholders"),
    })(app, {}, request);
  };
});;
