import type RequestBag from "#request/RequestBag";
import type RequestBody from "#request/RequestBody";
import type RequestFacade from "#request/RequestFacade";
import type RouteOptions from "#route/Options";
import type { Unpack } from "@rcompat/type";

type InferSchema<S> = S extends { infer: infer I } ? Awaited<I> : never;

type ContentTypeMethod = {
  "application/json": "json";
  "text/plain": "text";
  "application/x-www-form-urlencoded": "form";
  "multipart/form-data": "multipart";
  "application/octet-stream": "blob";
};

type NarrowedBody<O extends RouteOptions, B extends RequestBody> =
  O extends {
    contentType: infer CT extends keyof ContentTypeMethod; body: infer S;
  }
  ? Omit<B, ContentTypeMethod[CT]> & {
    [K in ContentTypeMethod[CT]]: () => Promise<Unpack<InferSchema<S>>>;
  }
  : B;

type NarrowedPath<O extends RouteOptions> =
  O extends { path: infer S }
  ? RequestBag<Unpack<InferSchema<S>>>
  : RequestBag;

type NarrowedRequest<O extends RouteOptions> =
  Omit<RequestFacade, "body" | "path"> & {
    body: NarrowedBody<O, RequestBody>;
    path: NarrowedPath<O>;
  };

export type { NarrowedRequest as default };
