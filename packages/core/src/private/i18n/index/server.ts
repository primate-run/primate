import type API from "#i18n/API";
import type Catalog from "#i18n/Catalog";
import type Catalogs from "#i18n/Catalogs";
import type Config from "#i18n/Config";
import DEFAULT_PERSIST_MODE from "#i18n/constant/DEFAULT_PERSIST_MODE";
import format from "#i18n/format";
import Formatter from "#i18n/Formatter";
import type {
  DotPaths,
  EntriesOf,
  ParamsFromEntries,
  PathValue,
} from "#i18n/index/types";
import resolve from "#i18n/resolve";
import server_storage from "#i18n/storage";
import sInternal from "#i18n/symbol/internal";
import validate from "#i18n/validate";
import sConfig from "#symbol/config";
import type { Dict } from "@rcompat/type";
import is from "@rcompat/is";

export default function i18n<const C extends Catalogs>(config: Config<C>) {
  type Locale = keyof C & string;
  type Schema = C[typeof config.defaultLocale] extends Catalog
    ? C[typeof config.defaultLocale]
    : never;
  type Key = DotPaths<Schema> & string;
  type Resolved<K extends string> =
    [K] extends [Key] ? PathValue<Schema, K> : never;
  type Message<K extends Key> = Extract<Resolved<K>, string>;
  type Params<K extends Key> = ParamsFromEntries<EntriesOf<Message<K>>>;

  const catalogs: Catalogs = config.locales as Catalogs;
  for (const [locale, catalog] of Object.entries(catalogs)) {
    validate(catalog, locale);
  }
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

  type Result<K extends string> =
    K extends Key
    ? (Resolved<K> extends string ? string : Resolved<K>)
    : string;

  function t<K extends string>(...args: Args<K>): Result<K> {
    const active_locale = get_locale();
    const formatter = new Formatter(active_locale);
    const [key, params] = args as [string, Dict?];
    const translated =
      resolve(catalogs[active_locale], key) ??
      resolve(default_catalog, key) ??
      String(key);

    if (is.string(translated)) {
      return format(translated, params ?? {}, currency, formatter) as Result<K>;
    }
    return translated as Result<K>;

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
