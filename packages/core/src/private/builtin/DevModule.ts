import Module from "#Module";
import type NextHandle from "#module/NextHandle";
import type RequestFacade from "#request/RequestFacade";
import type ServeApp from "#ServeApp";
import reload_defaults from "@rcompat/build/reload/defaults";
import reload_path from "@rcompat/build/reload/path";

function pass(address: string, request: Request) {
  return fetch(address, {
    body: request.body,
    duplex: "half",
    headers: request.headers,
    method: request.method,
  } as RequestInit);
}

export default class DevModule extends Module {
  name = "builtin/dev";
  #paths: string[];
  #reload_url: string;

  constructor(app: ServeApp) {
    super();

    const assets = app.assets.map(asset => asset.src);
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
