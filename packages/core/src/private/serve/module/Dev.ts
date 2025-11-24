import reload from "#build/client/reload";
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

export default class DevModule extends Module {
  name = "builtin/dev";
  #paths: string[];
  #reload_url: string;

  constructor(app: ServeApp) {
    super();

    const assets = app.assets.map(asset => asset.src);
    this.#paths = ([reload.path]).concat(assets as string[]);
    this.#reload_url = `http://${reload.host}:${reload.port}`;
  }

  handle(request: RequestFacade, next: NextHandle) {
    const { pathname } = new URL(request.url);

    return this.#paths.includes(pathname as "/esbuild")
      ? pass(`${this.#reload_url}${pathname}`, request.original)
      : next(request);
  }
}
