import type RequestFacade from "#request/RequestFacade";
import type ResponseLike from "#response/ResponseLike";
import type MaybePromise from "@rcompat/type/MaybePromise";

type RouteFunction = (request: RequestFacade) => MaybePromise<ResponseLike>;

export { RouteFunction as default };
