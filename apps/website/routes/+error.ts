import response from "primate/response";
import route from "primate/route";

route.get(request => response.view("Error.svelte", {
  pathname: request.url.pathname,
}));
