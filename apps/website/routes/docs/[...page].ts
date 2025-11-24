import type Component from "@primate/markdown/Component";
import response from "primate/response";
import route from "primate/route";

route.get(request => {
  const page = request.path.get("page");

  return app => {
    const $page = page.endsWith(".md") ? page.slice(0, -".md".length) : page;
    const { html, toc, md } = app.loadView<Component>(`content/docs/${$page}.md`);

    if (page.endsWith(".md")) return response.text(md)(app);

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
