import log from "#log";
import Module from "#Module";
import type NextHandle from "#module/NextHandle";
import type RequestFacade from "#request/RequestFacade";
import type ServeApp from "#serve/App";
import c from "@rcompat/cli/color";

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
  #reload: string;

  constructor(app: ServeApp) {
    super();

    const assets = app.assets.map(asset => asset.src);
    this.#paths = ["/esbuild"].concat(assets as string[]);
    const { host, port } = app.livereload;
    this.#reload = `http://${host}:${port}`;
    log.print(`↻ live reload ${c.dim(this.#reload)}\n`);
  }

  handle(request: RequestFacade, next: NextHandle) {
    const { pathname } = new URL(request.url);

    return this.#paths.includes(pathname)
      ? pass(`${this.#reload}${pathname}`, request.original)
      : next(request);
  }
}
