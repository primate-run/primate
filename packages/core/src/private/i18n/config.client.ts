import type API from "#i18n/API";
import type { Args, Result, TFn } from "#i18n/API";
import type Catalog from "#i18n/Catalog";
import type Catalogs from "#i18n/Catalogs";
import type Config from "#i18n/Config";
import COOKIE_NAME from "#i18n/constant/COOKIE_NAME";
import DEFAULT_PERSIST_MODE from "#i18n/constant/DEFAULT_PERSIST_MODE";
import PERSIST_HEADER from "#i18n/constant/PERSIST_HEADER";
import PERSIST_METHOD from "#i18n/constant/PERSIST_METHOD";
import PERSIST_STORAGE_KEY from "#i18n/constant/PERSIST_STORAGE_KEY";
import format from "#i18n/format";
import Formatter from "#i18n/Formatter";
import resolve from "#i18n/resolve";
import validate from "#i18n/validate";
import is from "@rcompat/is";
import type { Dict } from "@rcompat/type";

type RestoreRequest = {
  cookies?: Record<string, string | undefined>;
};

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
  const persist = config.persist ?? DEFAULT_PERSIST_MODE;
  const locales = Object.keys(catalogs) as Locale[];

  let active_locale: Locale = config.defaultLocale;

  function get(): Locale {
    return active_locale;
  }

  function restore_cookie(request?: RestoreRequest) {
    const saved = request?.cookies?.[COOKIE_NAME] as Locale | undefined;
    if (saved !== undefined && saved in catalogs) active_locale = saved;
  };

  function restore_storage(kind: "localStorage" | "sessionStorage") {
    try {
      const storage = kind === "localStorage" ? localStorage : sessionStorage;
      const saved = storage.getItem(PERSIST_STORAGE_KEY) as Locale | null;
      if (saved !== null && saved in catalogs) active_locale = saved;
    } catch {
      // ignore storage failures
    }
  };

  function restore(request?: RestoreRequest) {
    if (persist === false) return;
    if (persist === "cookie") {
      restore_cookie(request);
      return;
    }
    restore_storage(persist);
  };

  function persist_locale(locale: Locale) {
    if (persist === false) return;
    if (persist === "cookie") {
      void fetch("/", {
        method: PERSIST_METHOD,
        headers: { [PERSIST_HEADER]: locale },
        keepalive: true,
      }).then(response => {
        if (!response.ok) {
          console.warn(`[i18n] persist failed: ${response.status}`);
        }
      }).catch(error => {
        console.warn("[i18n] persist failed", error);
      });
      return;
    }
    try {
      const storage = persist === "localStorage"
        ? localStorage
        : sessionStorage
        ;
      storage.setItem(PERSIST_STORAGE_KEY, locale);
    } catch {
      // ignore storage failures
    }
  };

  function set(locale: Locale) {
    if (!(locale in catalogs)) {
      throw new Error(`[i18n] Unknown locale "${locale}".`);
    }
    active_locale = locale;
    persist_locale(locale);
  };

  function t<K extends string>(...args: Args<C, K>): Result<C, K> {
    const formatter = new Formatter(active_locale);
    const [key, params = {}] = args as [string, Dict?];
    const translated =
      resolve(catalogs[active_locale], key) ??
      resolve(default_catalog, key) ??
      String(key);

    return (is.string(translated)
      ? format(translated, params, currency, formatter)
      : translated) as Result<C, K>;
  }

  const api = t as TFn<C> & API<C>;
  api.defaultLocale = config.defaultLocale;
  api.locales = locales;
  api.catalogs = catalogs;
  api.currency = currency;
  api.locale = { get, set };
  api.restore = restore;
  api.with = (_locale: Locale) => {
    throw new Error("[i18n] with is not supported on client.");
  };

  return api;
}
