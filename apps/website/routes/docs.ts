import response from "primate/response";
import route from "primate/route";
import index_md from "view:content/docs/index";

const { html, toc } = index_md;

route.get(request => {
  const props = {
    app: request.config,
    content: html,
    path: "/" + request.url.pathname.slice("/docs/".length),
    toc,
  };
  return response.view("Static.svelte", props, {
    placeholders: request.placeholders,
  });
});
