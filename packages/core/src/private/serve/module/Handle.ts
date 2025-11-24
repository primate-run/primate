import route from "#request/route";
import Module from "#Module";
import type RequestFacade from "#request/RequestFacade";
import type ServeApp from "#serve/App";

export default class HandleModule extends Module {
  name = "builtin/handle";
  #app: ServeApp;

  constructor(app: ServeApp) {
    super();

    this.#app = app;
  }

  async handle(request: RequestFacade) {
    return await this.#app.serveAsset(request.url.pathname)
      ?? route(this.#app, request);
  }
}
