import client_error from "#handler/error";
import json from "#handler/json";
import respond from "#hook/respond";
import log from "#log";
import type RequestHook from "#module/RequestHook";
import type RequestFacade from "#RequestFacade";
import type ResponseLike from "#ResponseLike";
import type RouteFunction from "#RouteFunction";
import type ServeApp from "#ServeApp";
import Status from "@rcompat/http/Status";
import type MaybePromise from "@rcompat/type/MaybePromise";
import ValidationError from "pema/ValidationError";

type HookExec<I, O> = (i: I, next: (_: I) => MaybePromise<O>)
  => MaybePromise<O>;
type RouteHook = HookExec<RequestFacade, ResponseLike>;

const reducer = async (hooks: RouteHook[], request: RequestFacade): Promise<ResponseLike> => {
  const [first, ...rest] = hooks;

  if (rest.length === 0) {
    return await first(request, _ => new Response());
  };
  return await first(request, _ => reducer(rest, _));
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
    request,
    response: response as ResponseLike,
  };
};

export default async function(app: ServeApp, partial_request: RequestFacade) {
  // if tryreturn throws, this will default
  let error_handler = app.defaultErrorRoute;

  try {
    const route = await app.route(partial_request);

    if (route === undefined) {
      return client_error()(app, {}, partial_request) as Response;
    }

    const { errors, guards, handler, layouts } = route;

    error_handler = errors.at(-1);

    const route_hooks = app.modules.map(module => module.route.bind(module));
    const hooks = [...route_hooks, guard(app, guards), last(handler)];

    // handle request
    const { request, response } = await reducer(hooks, route.request) as {
      request: RequestFacade;
      response: ResponseLike;
    };

    const $layouts = { layouts: await get_layouts(layouts, request) };
    return respond(response)(app, $layouts, request) as Response;
  } catch (error) {
    const request = partial_request;
    if (error instanceof ValidationError) {
      return json({ error: error.toJSON() },
        { status: Status.BAD_REQUEST })(app) as Response;
    }
    log.error(error);
    // the +error.js page itself could fail
    try {
      return respond(await error_handler!(request))(app, {}, request) as Response;
    } catch {
      return client_error()(app, {}, request) as Response;
    }
  }
};
