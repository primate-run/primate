import type Next from "#module/Next";
import type RequestFacade from "#request/RequestFacade";

type NextHandle = Next<RequestFacade, Response>;

export type { NextHandle as default };
