import client_error from "#handler/error";
import json from "#handler/json";
import guard from "#hook/guard";
import respond from "#hook/respond";
import log from "#log";
import type RequestFacade from "#RequestFacade";
import type ResponseLike from "#ResponseLike";
import type RouteFunction from "#RouteFunction";
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
    return await respond(response)(app, $layouts, request) as Response;
  } catch (error) {
    const request = partial_request;
    if (error instanceof ParseError) {
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
