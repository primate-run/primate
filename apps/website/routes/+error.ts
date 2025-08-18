import route from "primate/route";
import view from "primate/response/view";

route.get(request => view("Error.svelte", {
  app: request.config,
  pathname: request.url.pathname,
}));
