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

function is_with(value: unknown): value is WithResult<RouteOptions> {
  return typeof value === "object" &&
    value !== null &&
    "handler" in value &&
    "options" in value;
}

function serialize_body(contentType: string | undefined, body: unknown) {
  if (body === undefined) return undefined;

  if (contentType === "application/json") {
    return JSON.stringify(body);
  }

  if (contentType === "application/x-www-form-urlencoded") {
    return body instanceof URLSearchParams
      ? body
      : new URLSearchParams(body as Record<string, string>);
  }

  return body as BodyInit;
}

function headers(contentType: string | undefined): HeadersInit {
  if (contentType === undefined) return {};
  if (contentType === "multipart/form-data") return {};
  return { "Content-Type": contentType };
}

function route<R extends RouteHandlers>(handlers: R) {
  return {
    _handlers: Object.fromEntries(
      Object.entries(handlers).map(([method, value]) => {
        const options = is_with(value) ? value.options : {};
        return [method, { contentType: options.contentType }];
      }),
    ),
    connect(path: string): ClientRoute<R> {
      return Object.fromEntries(
        Object.entries(this._handlers).map(([method, { contentType }]) => {
          const fn = async (args: { body?: unknown } = {}) => {
            return fetch(path, {
              method: method.toUpperCase(),
              headers: headers(contentType),
              body: serialize_body(contentType, args.body),
            });
          };
          return [method, Object.assign(fn, { contentType })];
        }),
      ) as ClientRoute<R>;
    },
  };
}

route.with = function <O extends RouteOptions>(
  options: O,
  handler: RouteHandler<O>,
): WithResult<O> {
  return { handler, options };
};

export default route;
