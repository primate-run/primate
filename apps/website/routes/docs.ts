import Static from "#view/Static";
import type Component from "@primate/markdown/Component";
import response from "primate/response";
import route from "primate/route";

route.get(request => {
  return app => {
    const { html, toc } = app.loadView<Component>("docs/docs/index.md");
    const props = {
      content: html,
      path: "/" + request.url.pathname.slice("/docs/".length),
      toc,
    };
    return response.view(Static, props, {
      placeholders: request.get("placeholders"),
    })(app, {}, request);
  };
});
