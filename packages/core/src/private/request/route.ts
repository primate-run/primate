import fail from "#fail";
import log from "#log";
import type RequestHook from "#module/RequestHook";
import type RequestFacade from "#request/RequestFacade";
import response_error from "#response/error";
import response_json from "#response/json";
import respond from "#response/respond";
import type ResponseLike from "#response/ResponseLike";
import type RouteHandler from "#route/Handler";
import type ServeApp from "#serve/App";
import Status from "@rcompat/http/Status";
import type { MaybePromise } from "@rcompat/type";
import ParseError from "pema/ParseError";

type RouteResult = {
  request: RequestFacade;
  response: ResponseLike;
};

const result = (request: RequestFacade, response: ResponseLike): RouteResult =>
  ({ request, response });

type InternalNext = (r: RequestFacade) => MaybePromise<RouteResult>;
type InternalHook = (r: RequestFacade, next: InternalNext) =>
  MaybePromise<RouteResult>;

function wrap_hook(h: RequestHook): InternalHook {
  return async (request, next) => {
    let downstream: RouteResult | undefined;
    let called_next = false;

    const response = await h(request, async r => {
      if (called_next) throw fail("hook called next() more than once");
      called_next = true;
      downstream = await next(r);
      return downstream.response;
    });

    // hook returned nothing
    if (response === undefined) {
      if (called_next) {
        throw fail(
          "hook called next() but did not return a result; did you forget `return next(request)`?",
        );
      }
      throw fail(
        "hook must return a response-like value or return next(request)",
      );
    }

    // if the hook called next(), we preserve the downstream request (mutations) but
    // allow the hook to override the response by returning something else.
    return downstream !== undefined
      ? result(downstream.request, response)
      : result(request, response);
  };
}

async function run(hooks: InternalHook[], request: RequestFacade): Promise<RouteResult> {
  const [first, ...rest] = hooks;
  if (first === undefined) return result(request, new Response());
  if (rest.length === 0) return first(request, async r => result(r, new Response()));
  return first(request, r => run(rest, r));
}

export default async function(app: ServeApp, partial_request: RequestFacade) {
  let errorRoute: RouteHandler | undefined;

  try {
    const route = await app.route(partial_request);

    if (route === undefined) {
      return response_error()(app, {}, partial_request) as Response;
    }

    const { errors, hooks, layouts, handler } = route;

    errorRoute = errors[0];

    const module_hooks = app.modules.map(m => wrap_hook(m.route.bind(m)));
    const route_hooks = hooks.map(wrap_hook);
    const last: InternalHook = async (req, _next) =>
      result(req, await handler(req));

    const { request, response } = await run(
      [...module_hooks, ...route_hooks, last],
      route.request);

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
