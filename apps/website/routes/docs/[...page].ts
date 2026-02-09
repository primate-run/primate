import app from "#app";
import Static from "#view/Static";
import type Component from "@primate/markdown/Component";
import response from "primate/response";
import route from "primate/route";

route.get(request => {
  const page = request.path.get("page");
  const $page = page.endsWith(".md") ? page.slice(0, -".md".length) : page;
  const { html, toc, md } = app.view<Component>(`docs/docs/${$page}.md`);

  if (page.endsWith(".md")) return response.text(md);

  const props = {
    content: html,
    path: "/" + request.url.pathname.slice("/docs/".length),
    toc,
  };
  return response.view(Static, props, {
    placeholders: request.get("placeholders"),
  });
});
