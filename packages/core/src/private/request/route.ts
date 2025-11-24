import log from "#log";
import type RequestFacade from "#request/RequestFacade";
import response_error from "#response/error";
import response_json from "#response/json";
import respond from "#response/respond";
import type ResponseLike from "#response/ResponseLike";
import guard from "#route/guard";
import type RouteHandler from "#route/Handler";
import type ServeApp from "#serve/App";
import Status from "@rcompat/http/Status";
import type MaybePromise from "@rcompat/type/MaybePromise";
import ParseError from "pema/ParseError";

type HookExec<I, O> = (i: I, next: (_: I) => MaybePromise<O>)
  => MaybePromise<O>;
type RouteHook = HookExec<RequestFacade, ResponseLike>;

async function reducer(hooks: RouteHook[], request: RequestFacade):
  Promise<ResponseLike> {
  const [first, ...rest] = hooks;

  if (rest.length === 0) return await first(request, _ => new Response());
  return await first(request, _ => reducer(rest, _));
};

// last, preserve final request form
function last(handler: RouteHandler) {
  return async (request: RequestFacade) => {
    const response = await handler(request);
    return {
      request,
      response: response as ResponseLike,
    };
  };
};

export default async function(app: ServeApp, partial_request: RequestFacade) {
  let errorRoute: RouteHandler | undefined;

  try {
    const route = await app.route(partial_request);

    if (route === undefined) {
      return response_error()(app, {}, partial_request) as Response;
    }

    const { errors, guards, handler, layouts } = route;

    errorRoute = errors[0];

    const route_hooks = app.modules.map(module => module.route.bind(module));
    const hooks = [...route_hooks, guard(guards), last(handler)];

    // handle request
    const { request, response } = await reducer(hooks, route.request) as {
      request: RequestFacade;
      response: ResponseLike;
    };

    return await respond(response)(app, {
      layouts: await Promise.all(layouts.map(layout => layout(request))),
    }, request) as Response;
  } catch (error) {
    const request = partial_request;
    if (error instanceof ParseError) {
      return response_json(error.toJSON(),
        { status: Status.BAD_REQUEST })(app) as Response;
    }
    log.error(error);
    // the +error.js page itself could fail
    try {
      return respond(await errorRoute!(request))(app, {}, request) as Response;
    } catch {
      return response_error()(app, {}, request) as Response;
    }
  }
};
