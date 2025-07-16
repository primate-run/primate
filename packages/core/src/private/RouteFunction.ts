import type RequestFacade from "#RequestFacade";
import type ResponseLike from "#ResponseLike";

type RouteFunction = (request: RequestFacade) => ResponseLike;

export { RouteFunction as default };
