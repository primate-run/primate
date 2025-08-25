import type App from "#App";
import type BuildApp from "#BuildApp";
import type Next from "#module/Next";
import type NextBuild from "#module/NextBuild";
import type NextHandle from "#module/NextHandle";
import type NextRoute from "#module/NextRoute";
import type NextServe from "#module/NextServe";
import type RequestFacade from "#request/RequestFacade";
import type ServeApp from "#ServeApp";

export default abstract class Module {
  abstract get name(): string;

  init<T extends App>(app: T, next: Next<T>) {
    return next(app);
  }

  build(app: BuildApp, next: NextBuild) {
    return next(app);
  }

  serve(app: ServeApp, next: NextServe) {
    return next(app);
  }

  handle(request: RequestFacade, next: NextHandle) {
    return next(request);
  }

  route(request: RequestFacade, next: NextRoute) {
    return next(request);
  }
}
