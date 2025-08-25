import type Next from "#module/Next";
import type RequestFacade from "#request/RequestFacade";
import type ResponseLike from "#response/ResponseLike";

type NextRoute = Next<RequestFacade, ResponseLike>;

export type { NextRoute as default };
