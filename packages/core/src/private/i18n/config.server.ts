import type API from "#i18n/API";
import type { Args, Result, TFn } from "#i18n/API";
import type Catalog from "#i18n/Catalog";
import type Catalogs from "#i18n/Catalogs";
import type Config from "#i18n/Config";
import format from "#i18n/format";
import Formatter from "#i18n/Formatter";
import resolve from "#i18n/resolve";
import server_storage from "#i18n/storage";
import validate from "#i18n/validate";
import is from "@rcompat/is";
import type { Dict } from "@rcompat/type";

export default function i18n<const C extends Catalogs>(config: Config<C>) {
  type Locale = keyof C & string;
  type Schema = C[typeof config.defaultLocale] extends Catalog
    ? C[typeof config.defaultLocale]
    : never;

  const catalogs = config.locales;
  for (const [locale, catalog] of Object.entries(catalogs)) {
    validate(catalog, locale);
  }
  const default_catalog = catalogs[config.defaultLocale] as Schema;
  const currency = config.currency ?? "USD";
  const locales = Object.keys(catalogs) as Locale[];

  function get(): Locale {
    const store = server_storage().getStore();
    return store?.locale ?? config.defaultLocale;
  };

  function set(_locale: Locale) {
    throw new Error("[i18n] locale.set is not supported on server.");
  };

  function translate(locale: Locale) {
    return <K extends string>(...args: Args<C, K>): Result<C, K> => {
      const formatter = new Formatter(locale);
      const [key, params = {}] = args as [string, Dict?];
      const translated =
        resolve(catalogs[locale], key) ??
        resolve(default_catalog, key) ??
        String(key);
      return (is.string(translated)
        ? format(translated, params, currency, formatter)
        : translated) as Result<C, K>;
    };
  }

  function t<K extends string>(...args: Args<C, K>): Result<C, K> {
    return translate(get())(...args);
  }

  const api = t as TFn<C> & API<C>;
  api.defaultLocale = config.defaultLocale;
  api.locales = locales;
  api.catalogs = catalogs;
  api.currency = currency;
  api.locale = { get, set };
  api.restore = () => { };
  api.with = (locale: Locale) => {
    if (!(locale in catalogs)) {
      throw new Error(`[i18n] Unknown locale "${locale}".`);
    }
    return translate(locale);
  };

  return api;
}
