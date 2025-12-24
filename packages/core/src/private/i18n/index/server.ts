import type API from "#i18n/API";
import type Catalog from "#i18n/Catalog";
import type Catalogs from "#i18n/Catalogs";
import type Config from "#i18n/Config";
import DEFAULT_PERSIST_MODE from "#i18n/constant/DEFAULT_PERSIST_MODE";
import format from "#i18n/format";
import Formatter from "#i18n/Formatter";
import server_storage from "#i18n/storage";
import sInternal from "#i18n/symbol/internal";
import type TypeOf from "#i18n/TypeOf";
import sConfig from "#symbol/config";
import type { Dict } from "@rcompat/type";

type EntryOf<Body extends string> =
  Body extends `${infer Name}:${infer Spec}`
  ? { __name: Name & string; __type: TypeOf<Spec> }
  : { __name: Body & string; __type: string };

type EntriesOf<S extends string> =
  S extends `${infer _}{${infer Body}}${infer Rest}`
  ? EntryOf<Body> | EntriesOf<Rest>
  : never;

type ParamsFromEntries<E> =
  [E] extends [never] ? Dict : {
    [K in E as K extends { __name: infer N extends string } ? N : never]:
    K extends { __type: infer T } ? T : never
  };

export default function i18n<const C extends Catalogs>(config: Config<C>) {
  type Locale = keyof C & string;
  type Schema = C[typeof config.defaultLocale] extends Catalog
    ? C[typeof config.defaultLocale]
    : never;

  type Key = keyof Schema & string;
  type Message<K extends Key> = Schema[K] & string;
  type Params<K extends Key> = ParamsFromEntries<EntriesOf<Message<K>>>;

  const catalogs: Catalogs = config.locales as Catalogs;
  const default_catalog = catalogs[config.defaultLocale] as Schema;
  const currency = config.currency ?? "USD";
  const persist = config.persist ?? DEFAULT_PERSIST_MODE;

  const get_locale = (): Locale => {
    const storage = server_storage();
    const store = storage.getStore();
    return store?.locale ?? config.defaultLocale;
  };

  type Args<K extends string> =
    K extends Key
    ? ([EntriesOf<Message<K>>] extends [never]
      ? [key: K]
      : [key: K, params: Params<K>])
    : [`[i18n] Missing locale key "${K & string}".`];

  function t<K extends string>(...args: Args<K>): string {
    const active_locale = get_locale();
    const formatter = new Formatter(active_locale);
    const [key, maybe_params] = args as [Key, Dict?];
    const active = catalogs[active_locale];
    const translated =
      (active && active[key]) ??
      (default_catalog && default_catalog[key]) ??
      String(key);

    return format(translated, maybe_params ?? {}, currency, formatter);

  }

  type TFn = typeof t;
  type Translator = TFn & API<C>;
  type ReadableT = { subscribe(run: (value: Translator) => void): () => void };

  const api = t as Translator & ReadableT;

  api.locale = {
    get: get_locale,
    set: (_locale: Locale) => {
      throw new Error("[i18n] locale.set is not supported on server.");
    },
  };

  Object.defineProperty(api, sInternal, {
    value: {
      restore: () => { },
      init: () => { },
    },
  });

  Object.defineProperty(api, sConfig, {
    get: () => ({ ...config, persist }),
  });

  api.subscribe = (run: (value: Translator) => void) => {
    run(api);
    return () => { };
  };

  return api;
}
