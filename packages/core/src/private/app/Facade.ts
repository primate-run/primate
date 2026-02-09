import type Config from "#config/Config";
import type ServerView from "#frontend/ServerView";
import type ServeApp from "#serve/App";
import dict from "@rcompat/dict";

const s_attach = Symbol("attach");
const s_config = Symbol("config");

export { s_attach, s_config };

export default class AppFacade {
  #config: Config;
  #app?: ServeApp;

  constructor(config: Config) {
    this.#config = config;
  }

  [s_attach](app: ServeApp) {
    this.#app = app;
  }

  get [s_config]() {
    return this.#config;
  }

  config<P extends string>(path: P) {
    return dict.get(this.#config, path);
  }

  get #with() {
    if (!this.#app) throw new Error("ServeApp not bound yet (used too early)");
    return this.#app;
  }

  view<T = ServerView>(name: string) {
    return this.#with.loadView<T>(name);
  };

  get root() {
    return this.#with.root;
  }
}
