import type App from "#App";
import type BuildApp from "#build/App";
import type NextHandle from "#module/NextHandle";
import type NextRoute from "#module/NextRoute";
import type RequestFacade from "#request/RequestFacade";
import type ResponseLike from "#response/ResponseLike";
import type ServeApp from "#serve/App";
import type { MaybePromise } from "@rcompat/type";

export type InitHook = (app: App) => MaybePromise<void>;
export type BuildHook = (app: BuildApp) => MaybePromise<void>;
export type ServeHook = (app: ServeApp) => MaybePromise<void>;

export type HandleHook = (
  request: RequestFacade,
  next: NextHandle,
) => MaybePromise<Response>;

export type RouteHook = (
  request: RequestFacade,
  next: NextRoute,
) => MaybePromise<ResponseLike>;

export default interface Setup {
  onInit(hook: InitHook): void;
  onBuild(hook: BuildHook): void;
  onServe(hook: ServeHook): void;
  onHandle(hook: HandleHook): void;
  onRoute(hook: RouteHook): void;
}
