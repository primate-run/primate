import type Hook from "#module/Hook";
import type RequestFacade from "#request/RequestFacade";
import type ResponseLike from "#response/ResponseLike";

type RequestHook = Hook<RequestFacade, ResponseLike>;

export type { RequestHook as default };
