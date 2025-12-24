import type View from "#frontend/View";
import type RequestFacade from "#request/RequestFacade";
import type ServeApp from "#serve/App";
import type { Dict, MaybePromise } from "@rcompat/type";

type ResponseFunction =
  (app: ServeApp, transfer: Dict, request: RequestFacade)
    => MaybePromise<View | null | Response | undefined>;

export { ResponseFunction as default };
