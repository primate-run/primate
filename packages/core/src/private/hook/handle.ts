import client_error from "#handler/error";
import respond from "#hook/respond";
import log from "#log";
import type RequestHook from "#module/RequestHook";
import pass from "#pass";
import type RequestFacade from "#RequestFacade";
import type ResponseLike from "#ResponseLike";
import type RouteFunction from "#RouteFunction";
import type ServeApp from "#ServeApp";
import session_hook from "#session/hook";
import reload_defaults from "@rcompat/build/reload/defaults";
import reload_path from "@rcompat/build/reload/path";
import type MaybePromise from "@rcompat/type/MaybePromise";

type HookExec<I, O> = (i: I, next: (_: I) => MaybePromise<O>)
  => MaybePromise<O>;
type RouteHook = HookExec<RequestFacade, ResponseLike>;
type HandleHook = HookExec<RequestFacade, Response>;

const reducer = async (hooks: RouteHook[], request: RequestFacade): Promise<ResponseLike> => {
  const [first, ...rest] = hooks;

  if (rest.length === 0) {
    return await first(request, _ => new Response());
  };
  return await first(request, _ => reducer(rest, _));
};

const reducer2 = async (modules: HandleHook[], request: RequestFacade): Promise<Response> => {
  const [first, ...rest] = modules;

  if (rest.length === 0) {
    return await first(request, _ => new Response());
  };
  return await first(request, _ => reducer2(rest, _));
};

type GuardError = {
  response: Exclude<ResponseLike, void>;
  type: symbol;
};

const guard_error = Symbol("guard_error");

const guard = (app: ServeApp, guards: RouteFunction[]): RequestHook => async (request, next) => {
  // handle guards
  try {
    for (const guard of guards) {
      const response = await guard(request);
      // @ts-expect-error guard
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

const get_layouts = async (layouts: RouteFunction[], request: RequestFacade) => {
  //  const stop_at = layouts.findIndex(({ recursive }) => recursive === false);
  return Promise.all(layouts
    //   .slice(stop_at === -1 ? 0 : stop_at)
    .map(layout => layout(request)));
};
// last handler, preserve final request form
const last = (handler: RouteFunction) => async (request: RequestFacade) => {
  const response = await handler(request);
  return {
    response: response as ResponseLike,
    request,
  };
};

const as_route = async (app: ServeApp, partial_request: RequestFacade) => {
  // if tryreturn throws, this will default
  let error_handler = app.defaultErrorRoute;

  try {
    const route = await app.route(partial_request);

    if (route === undefined) {
      return client_error()(app, {}, partial_request) as Response;
    }

    const { guards, errors, layouts, handler } = route;

    error_handler = errors.at(-1);

    const route_hooks = app.modules.map(module => module.route.bind(module));
    const hooks = [...route_hooks, guard(app, guards), last(handler)];

    // handle request
    const { request, response } = await reducer(hooks, route.request) as {
      response: ResponseLike;
      request: RequestFacade;
    };

    const $layouts = { layouts: await get_layouts(layouts, request) };
    return respond(response)(app, $layouts, request) as Response;
  } catch (error) {
    log.error(error);
    const request = partial_request;
    // the +error.js page itself could fail
    try {
      return respond(await error_handler!(request))(app, {}, request) as Response;
    } catch {
      return client_error()(app, {}, request) as Response;
    }
  }
};

export default (app: ServeApp) => {
  const handle = async (request: RequestFacade) =>
    await app.serve(request.url.pathname) ?? as_route(app, request);

  const assets = app.assets
    .filter(asset => asset.type !== "importmap")
    .map(asset => asset.src);
  const paths = ([reload_path as string]).concat(assets as string[]);
  const http = app.config("http");
  const reload_url = `http://${http.host}:${reload_defaults.port}`;

  const proxy: RequestHook = (facade, next) => {
    const { pathname } = new URL(facade.url);

    return paths.includes(pathname as "/esbuild")
      ? pass(`${reload_url}${pathname}`, facade.request)
      : next(facade);
  };;

  // first hook
  const hotreload = ((facade, next) => app.mode === "development"
    ? proxy(facade, next)
    : next(facade)) satisfies RequestHook;

  const modules = [hotreload, session_hook(app),
    ...app.modules.map(module => module.handle.bind(module)), handle];

  return (request: RequestFacade) => reducer2(modules, request);
};
