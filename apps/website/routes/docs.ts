import type Component from "@primate/markdown/Component";
import response from "primate/response";
import route from "primate/route";

route.get(request => {
  return app => {
    const { html, toc } = app.loadView<Component>("content/docs/index.md");
    const props = {
      app: request.config,
      content: html,
      path: "/" + request.url.pathname.slice("/docs/".length),
      toc,
    };
    return response.view("Static.svelte", props, {
      placeholders: request.placeholders,
    })(app, {}, request);
  };
});
