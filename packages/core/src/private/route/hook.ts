import type NextRoute from "#module/NextRoute";
import type RequestFacade from "#request/RequestFacade";
import type ResponseLike from "#response/ResponseLike";
import router from "#route/router";
import type { MaybePromise } from "@rcompat/type";

export default function hook(
  fn: (request: RequestFacade, next: NextRoute) => MaybePromise<ResponseLike>,
) {
  router.addHook(fn);
}
