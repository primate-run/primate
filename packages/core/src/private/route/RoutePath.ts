import type Verb from "#request/Verb";
import type RouteFunction from "#route/RouteFunction";

type RoutePath = { [key in Verb]?: RouteFunction; };

export type { RoutePath as default };
