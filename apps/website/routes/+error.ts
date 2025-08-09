import route from "primate/route";
import view from "primate/view";

route.get(request => view("Error.svelte", {
  app: request.config,
  pathname: request.url.pathname,
}));
