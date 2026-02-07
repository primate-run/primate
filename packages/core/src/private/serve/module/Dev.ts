import Module from "#Module";
import type NextHandle from "#module/NextHandle";
import type RequestFacade from "#request/RequestFacade";
import type ServeApp from "#serve/App";

function pass(address: string, request: Request) {
  return fetch(address, {
    body: request.body,
    duplex: "half",
    headers: request.headers,
    method: request.method,
  } as RequestInit);
}

// https://esbuild.github.io/api/#live-reload
export default class DevModule extends Module {
  name = "builtin/dev";
  #paths: string[];
  #reload_url: string;

  constructor(app: ServeApp) {
    super();

    const assets = app.assets.map(asset => asset.src);
    const { host, port } = app.config("livereload");
    this.#paths = ["/esbuild"].concat(assets as string[]);
    this.#reload_url = `http://${host}:${port}`;
  }

  handle(request: RequestFacade, next: NextHandle) {
    const { pathname } = new URL(request.url);

    return this.#paths.includes(pathname)
      ? pass(`${this.#reload_url}${pathname}`, request.original)
      : next(request);
  }
}
