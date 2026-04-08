import methods from "#request/methods";
import type { Method } from "#request/methods";
import type RouteHandler from "#route/Handler";
import type RouteOptions from "#route/Options";
import router from "#route/router";

type Route = {
  [key in Method]: (handler: RouteHandler, options?: RouteOptions) => void;
};

export default Object.fromEntries(methods.map(method =>
  [method, (handler: RouteHandler, options?: RouteOptions) => {
    router.add(method, handler, options);
  }])) as Route;
