import type Hook from "#module/Hook";
import type RequestFacade from "#request/RequestFacade";

type RequestHook = Hook<RequestFacade, Response>;

export type { RequestHook as default };
