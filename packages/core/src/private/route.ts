import E from "#errors";
import type RouteHandler from "#route/Handler";
import type RouteOptions from "#route/Options";
import type { Method } from "@rcompat/http";
import is from "@rcompat/is";

const BRAND = Symbol("route.with");

type WithResult<O extends RouteOptions> = {
  [BRAND]: true;
  handler: RouteHandler;
  options: O;
};

type AnyHandler = RouteHandler | WithResult<RouteOptions>;
type RouteHandlers = {
  [key in Method]?: AnyHandler;
};

function is_with(value: AnyHandler): value is WithResult<RouteOptions> {
  return is.branded(value, BRAND);
}

function route(handlers: RouteHandlers) {
  return Object.fromEntries(
    Object.entries(handlers).map(([method, value]) => {
      if (is_with(value)) {
        return [method, { handler: value.handler, options: value.options }];
      }
      return [method, { handler: value, options: {} }];
    }),
  );
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

export default route;
