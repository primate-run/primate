import type Verb from "#request/Verb";
import verbs from "#request/verbs";
import type RouteHandler from "#route/Handler";
import type RouteOptions from "#route/Options";
import router from "#route/router";

type Route = {
  [key in Verb]: (handler: RouteHandler, options?: RouteOptions) => void;
};

export default Object.fromEntries(verbs.map(verb =>
  [verb, (handler: RouteHandler, options?: RouteOptions) => {
    router.add(verb, handler, options);
  }])) as Route;
