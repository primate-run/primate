import type NextRoute from "#module/NextRoute";
import type RequestFacade from "#request/RequestFacade";
import type ResponseLike from "#response/ResponseLike";
import type { MaybePromise } from "@rcompat/type";

type HookFn = (request: RequestFacade, next: NextRoute) =>
  MaybePromise<ResponseLike>;

export default function hook(fn: HookFn) {
  return fn;
}
