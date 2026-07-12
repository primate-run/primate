import type View from "#client/View";
import type RequestFacade from "#request/RequestFacade";
import type ServeApp from "#serve/App";
import type { Dict, MaybePromise } from "@rcompat/type";

type ResponseFunction<Props = never, Result = never> = {
  (app: ServeApp, transfer: Dict, request: RequestFacade):
    MaybePromise<View | null | Response | undefined>;
  readonly _props?: Props;
  readonly _result?: Result;
};

export { ResponseFunction as default };
