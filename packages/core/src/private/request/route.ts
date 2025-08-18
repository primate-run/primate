import log from "#log";
import type RequestFacade from "#request/RequestFacade";
import errorResponse from "#response/error";
import jsonResponse from "#response/json";
import respond from "#response/respond";
import type ResponseLike from "#response/ResponseLike";
import guard from "#route/guard";
import type RouteFunction from "#route/RouteFunction";
import type ServeApp from "#ServeApp";
import Status from "@rcompat/http/Status";
import type MaybePromise from "@rcompat/type/MaybePromise";
import ParseError from "pema/ParseError";

type HookExec<I, O> = (i: I, next: (_: I) => MaybePromise<O>)
  => MaybePromise<O>;
type RouteHook = HookExec<RequestFacade, ResponseLike>;

async function reducer(hooks: RouteHook[], request: RequestFacade):
  Promise<ResponseLike> {
  const [first, ...rest] = hooks;

  if (rest.length === 0) {
    return await first(request, _ => new Response());
  };
  return await first(request, _ => reducer(rest, _));
};

async function getLayouts(layouts: RouteFunction[], request: RequestFacade) {
  //  const stop_at = layouts.findIndex(({ recursive }) => recursive === false);
  return Promise.all(layouts
    //   .slice(stop_at === -1 ? 0 : stop_at)
    .map(layout => layout(request)));
};
// last, preserve final request form
function last(routeFunction: RouteFunction) {
  return async (request: RequestFacade) => {
    const response = await routeFunction(request);
    return {
      request,
      response: response as ResponseLike,
    };
  };
};

export default async function(app: ServeApp, partial_request: RequestFacade) {
  // if tryreturn throws, this will default
  let errorRoute = app.defaultErrorRoute;

  try {
    const route = await app.route(partial_request);

    if (route === undefined) {
      return errorResponse()(app, {}, partial_request) as Response;
    }

    const { errors, guards, layouts, routeFunction } = route;

    errorRoute = errors.at(-1);

    const route_hooks = app.modules.map(module => module.route.bind(module));
    const hooks = [...route_hooks, guard(app, guards), last(routeFunction)];

    // handle request
    const { request, response } = await reducer(hooks, route.request) as {
      request: RequestFacade;
      response: ResponseLike;
    };

    const $layouts = { layouts: await getLayouts(layouts, request) };
    return await respond(response)(app, $layouts, request) as Response;
  } catch (error) {
    const request = partial_request;
    if (error instanceof ParseError) {
      return jsonResponse({ error: error.toJSON() },
        { status: Status.BAD_REQUEST })(app) as Response;
    }
    log.error(error);
    // the +error.js page itself could fail
    try {
      return respond(await errorRoute!(request))(app, {}, request) as Response;
    } catch {
      return errorResponse()(app, {}, request) as Response;
    }
  }
};
