import type ResponseLike from "#response/ResponseLike";
import type ResponseFunction from "#response/ResponseFunction";
import type ContentTypeMap from "#route/ContentTypeMap";
import type RouteHandler from "#route/Handler";
import hook from "#route/hook";
import type RouteOptions from "#route/Options";
import is from "@rcompat/is";
import type { Dict, Unpack } from "@rcompat/type";

type InputSchema<S> = S extends { input: infer I } ? I : never;

type Body<O extends RouteOptions> =
  O extends {
    contentType: infer _CT extends keyof ContentTypeMap;
    body: infer S;
  }
  ? Unpack<InputSchema<S>>
  : O extends {
    contentType: infer CT extends keyof ContentTypeMap;
  }
  ? ContentTypeMap[CT]
  : never;

type Path<O extends RouteOptions> =
  O extends { path: infer S }
  ? Unpack<InputSchema<S>>
  : never;

type MethodMeta = {
  contentType?: string;
};

type RequestMeta = {
  headers?: HeadersInit;
};

type Page<R> = Awaited<R> extends infer Result
  ? Result extends ResponseFunction<infer Props> ? Props : never
  : never;

type ClientResult<R> = Awaited<R> extends infer Result
  ? Result extends ResponseFunction ? never : Result
  : never;

type ClientMethod<O extends RouteOptions, R = unknown> = MethodMeta & {
  _result?: ClientResult<R>;
  Page: Page<R>;
} & (
    Body<O> extends never
    ? Path<O> extends never
    ? (args?: RequestMeta) => Promise<Response>
    : (args: { path: Path<O> } & RequestMeta) => Promise<Response>
    : Path<O> extends never
    ? (args: { body: Body<O> } & RequestMeta) => Promise<Response>
    : (args: { body: Body<O>; path: Path<O> } & RequestMeta) =>
      Promise<Response>
  );

type ClientRoute<R> = {
  [K in keyof R]: R[K] extends {
    options: infer O extends RouteOptions;
    result?: infer Result;
  }
  ? ClientMethod<O, Result>
  : R[K] extends (...args: any[]) => infer Result
  ? ClientMethod<{}, Result>
  : (args?: RequestMeta) => Promise<Response>;
};

type WithResult<O extends RouteOptions, R = unknown> = {
  handler: RouteHandler<O>;
  options: O;
  result?: R;
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
  if (contentType === "application/json") return JSON.stringify(body);
  if (contentType === "application/x-www-form-urlencoded") {
    return body instanceof URLSearchParams
      ? body
      : new URLSearchParams(body as Dict<string>);
  }
  return body as BodyInit;
}

function headers(contentType: string | undefined): HeadersInit {
  if (contentType === undefined) return {};
  if (contentType === "multipart/form-data") return {};
  return { "Content-Type": contentType };
}

function route<R extends RouteHandlers>(handlers: R): ClientRoute<R> {
  const r = {
    _handlers: Object.fromEntries(
      Object.entries(handlers).map(([method, value]) => {
        const options = is_with(value) ? value.options : {};
        return [method, { contentType: options.contentType }];
      }),
    ),
    connect(path: string): ClientRoute<R> {
      return Object.fromEntries(
        Object.entries(this._handlers).map(([method, { contentType }]) => {
          const fn = async (args: {
            body?: unknown;
            path?: Dict<string>;
            headers?: HeadersInit;
          } = {}) => {
            const resolved = is.defined(args.path)
              ? path.replace(/\[{1,2}\.{0,3}([^\]]+)\]{1,2}/g, (match, key) => {
                const is_rest = match.includes("...");
                const is_optional = match.startsWith("[[");
                const value = (args.path as Dict<string>)[key];
                if (value === undefined) return is_optional ? "" : match;
                return is_rest ? value : encodeURIComponent(value);
              })
              : path;

            return fetch(resolved, {
              method: method.toUpperCase(),
              headers: {
                ...headers(contentType),
                ...(args.headers ?? {}),
              },
              body: serialize_body(contentType, args.body),
            });
          };

          return [method, Object.assign(fn, { contentType })];
        }),
      ) as ClientRoute<R>;
    },
  };
  return r as never;
}

route.with = function <O extends RouteOptions, R extends ResponseLike>(
  options: O,
  handler: RouteHandler<O, R>,
): WithResult<O, R> {
  return { handler, options };
};

route.hook = hook;

export default route;
