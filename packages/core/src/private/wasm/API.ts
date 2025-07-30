import type RouteFunction from "#RouteFunction";
import type Verb from "#Verb";

/** The API that Primate exposes to the WASM module. */
type API = {
  [v in Verb]?: RouteFunction;
};

export type { API as default };
