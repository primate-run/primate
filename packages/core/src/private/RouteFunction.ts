import type RequestFacade from "#RequestFacade";
import type ResponseLike from "#ResponseLike";
import type MaybePromise from "@rcompat/type/MaybePromise";

type RouteFunction = (request: RequestFacade) => MaybePromise<ResponseLike>;

export { RouteFunction as default };
