import Module from "#Module";
import type NextHandle from "#module/NextHandle";
import pass from "#pass";
import type RequestFacade from "#request/RequestFacade";
import type ServeApp from "#ServeApp";
import reload_defaults from "@rcompat/build/reload/defaults";
import reload_path from "@rcompat/build/reload/path";

export default class DevModule extends Module {
  name = "builtin/dev";
  #paths: string[];
  #reload_url: string;

  constructor(app: ServeApp) {
    super();

    const assets = app.assets
      .filter(asset => asset.type !== "importmap")
      .map(asset => asset.src);
    const http = app.config("http");
    this.#paths = ([reload_path as string]).concat(assets as string[]);
    this.#reload_url = `http://${http.host}:${reload_defaults.port}`;
  }

  handle(request: RequestFacade, next: NextHandle) {
    const { pathname } = new URL(request.url);

    return this.#paths.includes(pathname as "/esbuild")
      ? pass(`${this.#reload_url}${pathname}`, request.original)
      : next(request);
  }
}
