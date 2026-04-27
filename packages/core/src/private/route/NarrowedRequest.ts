import type RequestBody from "#request/RequestBody";
import type RequestFacade from "#request/RequestFacade";
import type RouteOptions from "#route/Options";
import type { Unpack } from "@rcompat/type";
import type { Parsed } from "pema";

type ContentTypeMethod = {
  "application/json": "json";
  "text/plain": "text";
  "application/x-www-form-urlencoded": "form";
  "multipart/form-data": "multipart";
  "application/octet-stream": "blob";
};

type NarrowedBody<O extends RouteOptions, B extends RequestBody> =
  O extends {
    contentType: infer CT extends keyof ContentTypeMethod; body: Parsed<infer T>;
  }
  ? Omit<B, ContentTypeMethod[CT]> & {
    [K in ContentTypeMethod[CT]]: () => Promise<Unpack<T>>;
  }
  : B;

type NarrowedRequest<O extends RouteOptions> = Omit<RequestFacade, "body"> & {
  body: NarrowedBody<O, RequestBody>;
};

export type { NarrowedRequest as default };
