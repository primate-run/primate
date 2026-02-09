import app from "#app";
import Static from "#view/Static";
import type Component from "@primate/markdown/Component";
import response from "primate/response";
import route from "primate/route";

route.get(request => {
  const { html, toc } = app.view<Component>("docs/docs/index.md");
  const props = {
    content: html,
    path: "/" + request.url.pathname.slice("/docs/".length),
    toc,
  };
  return response.view(Static, props, {
    placeholders: request.get("placeholders"),
  });
});
