import type RouteHandler from "#route/Handler";
import type RouteOptions from "#route/Options";
import router from "#route/router";
import type { Method } from "@rcompat/http";
import http from "@rcompat/http";

type Route = {
  [key in Method]: (handler: RouteHandler, options?: RouteOptions) => void;
};

export default Object.fromEntries(http.methods.map(method =>
  [method, (handler: RouteHandler, options?: RouteOptions) => {
    router.add(method, handler, options);
  }])) as Route;
