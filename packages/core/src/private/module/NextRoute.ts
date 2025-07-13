import type Next from "#module/Next";
import type RequestFacade from "#RequestFacade";
import type ResponseLike from "#ResponseLike";

type NextRoute = Next<RequestFacade, ResponseLike>;

export type { NextRoute as default };
