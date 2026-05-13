import type ResponseLike from "#response/ResponseLike";
import type NarrowedRequest from "#route/NarrowedRequest";
import type RouteOptions from "#route/Options";
import type { MaybePromise } from "@rcompat/type";

type RouteHandler<
  O extends RouteOptions = RouteOptions,
  R extends ResponseLike = ResponseLike,
> = (request: NarrowedRequest<O>) => MaybePromise<R>;

export { RouteHandler as default };
