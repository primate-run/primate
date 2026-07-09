import E from "#errors";
import type ResponseFunction from "#response/ResponseFunction";
import type NarrowedRequest from "#route/NarrowedRequest";
import type RouteHandler from "#route/Handler";
import hook from "#route/hook";
import type RouteOptions from "#route/Options";
import type { Method } from "@rcompat/http";
import is from "@rcompat/is";
import type { MaybePromise, UndefinedToOptional, Unpack } from "@rcompat/type";
import type { Parsed } from "pema";

const BRAND = Symbol("route.with");

type WithResult<O extends RouteOptions> = {
  [BRAND]: true;
  handler: (request: NarrowedRequest<O>) => unknown;
  options: O;
};

type AnyHandler = RouteHandler | WithResult<RouteOptions>;
type RouteHandlers = {
  [key in Method]?: AnyHandler;
};

type RouteOptionsWithoutResponses = Omit<RouteOptions, "responses"> & {
  responses?: never;
};

type View<O extends RouteOptions> =
  O extends { responses: { view: infer S extends Parsed<unknown> } }
  ? UndefinedToOptional<Unpack<S["infer"]>>
  : never;

type RouteMethod<O extends RouteOptions> = {
  handler: (request: NarrowedRequest<O>) => unknown;
  options: O;
  View: View<O>;
};

type Routes<R extends RouteHandlers> = {
  [K in keyof R]: R[K] extends WithResult<infer O extends RouteOptions>
  ? RouteMethod<O>
  : RouteMethod<{}>;
};

function is_with(value: AnyHandler): value is WithResult<RouteOptions> {
  return is.branded(value, BRAND);
}

function route<R extends RouteHandlers>(handlers: R): Routes<R> {
  return Object.fromEntries(
    Object.entries(handlers).map(([method, value]) => {
      if (is_with(value)) {
        return [method, { handler: value.handler, options: value.options }];
      }
      return [method, { handler: value, options: {} }];
    }),
  ) as Routes<R>;
}

function with_route<O extends RouteOptions & { responses: { view: Parsed<unknown> } }>(
  options: O,
  handler: (request: NarrowedRequest<O>) => MaybePromise<ResponseFunction<View<O>>>,
): WithResult<O>;
function with_route<O extends RouteOptionsWithoutResponses>(
  options: O,
  handler: RouteHandler<O>,
): WithResult<O>;
function with_route<O extends RouteOptions>(
  options: O,
  handler: RouteHandler<O> | ((request: NarrowedRequest<O>) => unknown),
): WithResult<O> {
  if (options.body !== undefined && options.contentType === undefined) {
    throw E.build_body_requires_content_type();
  }
  return { [BRAND]: true, handler, options };
}

route.with = with_route;

route.hook = hook;

export default route;
