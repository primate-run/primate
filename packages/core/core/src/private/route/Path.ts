import type Verb from "#request/Verb";
import type RouteHandler from "#route/Handler";
import type RouteOptions from "#route/Options";

type RoutePath = { [key in Verb]?: {
  handler: RouteHandler;
  options: RouteOptions;
}; };

export type { RoutePath as default };
