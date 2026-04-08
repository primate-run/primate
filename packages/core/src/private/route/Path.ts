import type { Method } from "#request/methods";
import type RouteHandler from "#route/Handler";
import type RouteOptions from "#route/Options";

type RoutePath = { [key in Method]?: {
  handler: RouteHandler;
  options: RouteOptions;
}; };

export type { RoutePath as default };
