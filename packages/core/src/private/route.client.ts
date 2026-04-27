import type ContentTypeMap from "#route/ContentTypeMap";
import type RouteHandler from "#route/Handler";
import type RouteOptions from "#route/Options";
import type { Unpack } from "@rcompat/type";
import type { Parsed } from "pema";

type Body<O extends RouteOptions> =
  O extends {
    contentType: infer _CT extends keyof ContentTypeMap;
    body: infer S extends Parsed<unknown>;
  }
  ? Unpack<S["infer"]>
  : O extends {
    contentType: infer CT extends keyof ContentTypeMap;
  }
  ? ContentTypeMap[CT]
  : never;

type MethodMeta = {
  contentType?: string;
};

type ClientMethod<O extends RouteOptions> = MethodMeta & (
  Body<O> extends never
  ? () => Promise<Response>
  : (args: { body: Body<O> }) => Promise<Response>
);

type ClientRoute<R> = {
  [K in keyof R]: R[K] extends { options: infer O extends RouteOptions }
  ? ClientMethod<O>
  : () => Promise<Response>;
};

type WithResult<O extends RouteOptions> = {
  handler: RouteHandler<O>;
  options: O;
};

type RouteHandlers = {
  [key: string]: RouteHandler | WithResult<RouteOptions>;
};

function route<R extends RouteHandlers>(handlers: R): ClientRoute<R> {
  return {} as ClientRoute<R>;
}

route.with = function <O extends RouteOptions>(
  options: O,
  handler: RouteHandler<O>,
): WithResult<O> {
  return { handler, options };
};

export default route;
