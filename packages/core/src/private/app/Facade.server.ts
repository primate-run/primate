import type EnvSchema from "#app/EnvSchema";
import type Config from "#config/Config";
import E from "#errors";
import create_i18n from "#i18n/config";
import type I18NConfig from "#i18n/Config";
import missing_i18n from "#i18n/missing";
import type ServeApp from "#serve/App";
import dict from "@rcompat/dict";
import env from "@rcompat/env";
import type { ObjectType } from "pema";
import ParseError from "pema/ParseError";

const s_attach = Symbol("attach");
const s_config = Symbol("config");

export { s_attach, s_config };

type Env<P extends EnvSchema> = { [K in keyof P]: P[K]["infer"] };

type I18NRuntime<I extends I18NConfig | undefined> =
  I extends I18NConfig<infer C>
  ? ReturnType<typeof create_i18n<C>>
  : ReturnType<typeof create_i18n>;

export default class AppFacade<
  T extends EnvSchema = EnvSchema,
  I extends I18NConfig | undefined = undefined,
> {
  #config: Config;
  #app?: ServeApp;
  #env?: Env<T>;
  #i18n: I18NRuntime<I>;

  constructor(config: Config) {
    this.#config = config;
    this.#i18n = (
      config.i18n === undefined
        ? missing_i18n()
        : create_i18n(config.i18n)
    ) as I18NRuntime<I>;
  }

  [s_attach](app: ServeApp) {
    this.#app = app;

    const schema = this.#config.env.schema as ObjectType<T> | undefined;
    if (schema !== undefined) {
      try {
        this.#env = schema.parse(env.toJSON()) as Env<T>;
      } catch (error) {
        if (ParseError.is(error)) throw E.env_invalid_schema(error);
        throw error;
      }
    }
  }

  get [s_config]() {
    return this.#config;
  }

  get i18n(): I18NRuntime<I> {
    return this.#i18n;
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

  get views() {
    return this.#with.views;
  }

  get root() {
    return this.#with.root;
  }

  get log() {
    return this.#with.log;
  }
}
