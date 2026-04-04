import type EnvSchema from "#app/EnvSchema";
import type ServerView from "#client/ServerView";
import type Config from "#config/Config";
import E from "#errors";
import type ServeApp from "#serve/App";
import dict from "@rcompat/dict";
import env from "@rcompat/env";
import type { ObjectType } from "pema";
import ParseError from "pema/ParseError";

const s_attach = Symbol("attach");
const s_config = Symbol("config");

export { s_attach, s_config };

type Env<P extends EnvSchema> = { [K in keyof P]: P[K]["infer"] };

export default class AppFacade<T extends EnvSchema = EnvSchema> {
  #config: Config;
  #app?: ServeApp;
  #env?: Env<T>;

  constructor(config: Config) {
    this.#config = config;
  }

  [s_attach](app: ServeApp) {
    this.#app = app;

    const schema = this.#config.env.schema as ObjectType<T> | undefined;
    if (schema !== undefined) {
      try {
        this.#env = schema.coerce(env.toJSON()) as Env<T>;
      } catch (error) {
        if (ParseError.is(error)) throw E.env_invalid_schema(error);
        throw error;
      }
    }
  }

  get [s_config]() {
    return this.#config;
  }

  config<P extends string>(path: P) {
    return dict.get(this.#config, path);
  }

  env<K extends keyof T>(key: K): T[K]["infer"];
  env(key: string): unknown {
    if (this.#env !== undefined) {
      if (!(key in this.#env)) throw E.env_missing_key(key);
      return this.#env[key as keyof T];
    }
    return env.get(key);
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
