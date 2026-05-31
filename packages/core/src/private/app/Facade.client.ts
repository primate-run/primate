import type EnvSchema from "#app/EnvSchema";
import type Config from "#config/Config";
import create_i18n from "#i18n/config";
import type I18NConfig from "#i18n/Config";
import missing_i18n from "#i18n/missing";

type I18NRuntime<I extends I18NConfig | undefined> =
  I extends I18NConfig<infer C>
  ? ReturnType<typeof create_i18n<C>>
  : ReturnType<typeof create_i18n>;

/**
 * Browser stub for AppFacade.
 * env/config/root/log must never expose server-only data to clients.
 */
export default class AppFacade<
  T extends EnvSchema = EnvSchema,
  I extends I18NConfig | undefined = undefined,
> {
  #i18n: I18NRuntime<I>;

  constructor(config: Config) {
    this.#i18n = (
      config.i18n === undefined
        ? missing_i18n()
        : create_i18n(config.i18n)
    ) as I18NRuntime<I>;
  }

  get i18n(): I18NRuntime<I> {
    return this.#i18n;
  }

  config(_path: string): never {
    throw new Error("AppFacade.config() is not available in the browser");
  }

  env<K extends keyof T>(_key: K): T[K]["infer"];
  env(_key: string): never {
    throw new Error(
      "AppFacade.env() is server-only. Do not call env() in frontend/browser code.",
    );
  }

  get root(): never {
    throw new Error("AppFacade.root is not available in the browser");
  }

  get log(): never {
    throw new Error("AppFacade.log is not available in the browser");
  }
}
