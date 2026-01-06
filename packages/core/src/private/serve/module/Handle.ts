import Module from "#Module";
import type RequestFacade from "#request/RequestFacade";
import route from "#request/route";
import type ServeApp from "#serve/App";

export default class HandleModule extends Module {
  name = "builtin/handle";
  #app: ServeApp;

  constructor(app: ServeApp) {
    super();

    this.#app = app;
  }

  async handle(request: RequestFacade) {
    return await this.#app.serve_assets(request.url.pathname)
      ?? route(this.#app, request);
  }
}
