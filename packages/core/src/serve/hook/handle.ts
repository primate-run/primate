import client_error from "#handler/error";
import type { RequestHook } from "#module-loader";
import type RequestFacade from "#RequestFacade";
import type RequestInit from "#RequestInit";
import type ResponseLike from "#ResponseLike";
import type RouteFunction from "#RouteFunction";
import type RouteSpecial from "#RouteSpecial";
import type { ServeApp } from "#serve/app";
import session_hook from "#session/hook";
import cascade from "@rcompat/async/cascade";
import reload_defaults from "@rcompat/build/reload/defaults";
import reload_path from "@rcompat/build/reload/path";
import respond from "./respond.js";
import route from "./route.js";

type GuardError = {
  response: Exclude<ResponseLike, void>;
  type: symbol;
};

const guard_error = Symbol("guard_error");

const guard = (app: ServeApp, guards: RouteSpecial[]): RequestHook => async (request, next) => {
  // handle guards
  try {
    for (const guard of guards) {
      const response = await guard.default(request);
      if (response !== true) {
        throw {
          response,
          type: guard_error,
        } as GuardError;
      }
    }

    return next(request);
  } catch (error) {
    const _error = error as GuardError;
    if (_error.type === guard_error) {
      return respond(_error.response)(app, {}, request) as Response;
    }
    // rethrow if not guard error
    throw error;
  }
};

const get_layouts = async (layouts: RouteSpecial[], request: RequestFacade) => {
  const stop_at = layouts.findIndex(({ recursive }) => recursive === false);
  return Promise.all(layouts
    .slice(stop_at === -1 ? 0 : stop_at)
    .map(layout => (layout.default as RouteFunction)(request)));
};
// last handler, preserve final request form
const last = (handler: RouteFunction) => async (request: RequestFacade) => {
  const response = await handler(request);
  return { request, response };
};

const as_route = async (app: ServeApp, request: RequestFacade) => {
  // if tryreturn throws, this will default
  let error_handler = app.error.default;

  try {
    const { body, path, guards, errors, layouts, handler } =
      await route(app, request);

    error_handler = errors.at(-1)?.default as RouteFunction;

    const route_hooks = app.modules.route === undefined ? [] : app.modules.route;
    const hooks = [...route_hooks, guard(app, guards), last(handler)];

    // handle request
    const routed = await (cascade(hooks as RequestHook<false>[]))({ ...request, body, path });


    const $layouts = { layouts: await get_layouts(layouts, routed.request) };
    return respond(routed.response)(app, $layouts, routed.request);
  } catch(ex) {
    console.error(ex);
    // the +error.js page itself could fail
    try {
      return respond(await error_handler!(request))(app, {}, request);
    } catch {
      return client_error()(app, {}, request);
    }
  }
};

export default (app: ServeApp): ReturnType<typeof cascade> => {
  const handle = async (request: RequestFacade) =>
    (await app.loader.asset(request.url.pathname)) ?? as_route(app, request);

  const assets = app.assets
    .filter(asset => asset.type !== "importmap")
    .map(asset => asset.src);
  const paths = ([reload_path as string]).concat(assets as string[]);
  const http = app.config("http");
  const url = `http://${http.host}:${reload_defaults.port}`;

  const proxy = ((facade, next) => {
    const { pathname } = new URL(facade.url);
    const { method, headers, body } = facade.request;

    return paths.includes(pathname as "/esbuild")
      ? fetch(`${url}${pathname}`, { headers, method, body, duplex: "half" } as RequestInit)
      : next(facade);
  }) satisfies RequestHook;

  // first hook
  const hotreload = ((facade, next) => app.mode === "development"
    ? proxy(facade, next)
    : next(facade)) satisfies RequestHook;

  const modules = [hotreload, session_hook(app)]
    .concat(app.modules.handle !== undefined ? app.modules.handle : []);

  return cascade(modules as RequestHook<false>[], handle);
};
