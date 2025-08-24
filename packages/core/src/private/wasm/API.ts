import type Verb from "#request/Verb";
import type RouteHandler from "#route/Handler";

type API = { [key in Verb]?: RouteHandler; };

export type { API as default };
