import E from "#errors";
import type ResponseFunction from "#response/ResponseFunction";
import type NarrowedRequest from "#route/NarrowedRequest";
import type RouteHandler from "#route/Handler";
import hook from "#route/hook";
import type RouteOptions from "#route/Options";
import type { Method } from "@rcompat/http";
import is from "@rcompat/is";

const BRAND = Symbol("route.with");

type WithResult<O extends RouteOptions> = {
  [BRAND]: true;
  handler: (request: NarrowedRequest<O>) => unknown;
  options: O;
};

type Page<R> = Awaited<R> extends ResponseFunction<infer Props> ? Props : never;

type AnyHandler = RouteHandler | WithResult<RouteOptions>;
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
  [K in keyof R]: R[K] extends WithResult<infer O extends RouteOptions>
  ? R[K] extends { handler: (...args: any[]) => infer Result }
  ? RouteMethodWithResult<O, Result>
  : RouteMethod<O>
  : R[K] extends (...args: any[]) => infer Result
  ? RouteMethodWithResult<{}, Result>
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

route.with = function <O extends RouteOptions>(
  options: O,
  handler: RouteHandler<O>,
): WithResult<O> {
  if (options.body !== undefined && options.contentType === undefined) {
    throw E.build_body_requires_content_type();
  }
  return { [BRAND]: true, handler, options };
};

route.hook = hook;

export default route;
