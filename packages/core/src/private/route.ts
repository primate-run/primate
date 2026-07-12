import E from "#errors";
import type ResponseFunction from "#response/ResponseFunction";
import type ResponseLike from "#response/ResponseLike";
import type NarrowedRequest from "#route/NarrowedRequest";
import type RouteHandler from "#route/Handler";
import hook from "#route/hook";
import type RouteOptions from "#route/Options";
import type { Method } from "@rcompat/http";
import is from "@rcompat/is";

const BRAND = Symbol("route.with");

type WithResult<O extends RouteOptions, R extends ResponseLike> = {
  [BRAND]: true;
  handler: RouteHandler<O, R>;
  options: O;
};

type Page<R> = Awaited<R> extends infer Result
  ? Result extends ResponseFunction<infer Props> ? Props : never
  : never;

type AnyHandler = RouteHandler | WithResult<RouteOptions, ResponseLike>;
type RouteHandlers = {
  [key in Method]?: AnyHandler;
};

type RouteMethod<O extends RouteOptions> = {
  handler: (request: NarrowedRequest<O>) => unknown;
  options: O;
  Page: never;
};

type RouteMethodWithResult<O extends RouteOptions, R> = Omit<RouteMethod<O>, "Page"> & {
  Page: Page<R>;
};

type Routes<R extends RouteHandlers> = {
  [K in keyof R]: R[K] extends WithResult<infer O extends RouteOptions, infer Result>
  ? RouteMethodWithResult<O, Result>
  : R[K] extends (...args: any[]) => infer Result
  ? RouteMethodWithResult<{}, Result>
  : RouteMethod<{}>;
};

function is_with(value: AnyHandler): value is WithResult<RouteOptions, ResponseLike> {
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

route.with = function <O extends RouteOptions, R extends ResponseLike>(
  options: O,
  handler: RouteHandler<O, R>,
): WithResult<O, R> {
  if (options.body !== undefined && options.contentType === undefined) {
    throw E.build_body_requires_content_type();
  }
  return { [BRAND]: true, handler, options };
};

route.hook = hook;

export default route;
