import type RouteHandler from "#route/Handler";
import type { Method } from "@rcompat/http";

type RouteHandlers = {
  [key in Method]?: RouteHandler;
};

function route(handlers: RouteHandlers) {
  return handlers;
}

export default route;
