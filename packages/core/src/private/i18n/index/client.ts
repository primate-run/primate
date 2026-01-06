import type API from "#i18n/API";
import type Catalog from "#i18n/Catalog";
import type Catalogs from "#i18n/Catalogs";
import type Config from "#i18n/Config";
import DEFAULT_PERSIST_MODE from "#i18n/constant/DEFAULT_PERSIST_MODE";
import PERSIST_HEADER from "#i18n/constant/PERSIST_HEADER";
import PERSIST_METHOD from "#i18n/constant/PERSIST_METHOD";
import PERSIST_STORAGE_KEY from "#i18n/constant/PERSIST_STORAGE_KEY";
import format from "#i18n/format";
import Formatter from "#i18n/Formatter";
import type {
  DotPaths,
  EntriesOf,
  ParamsFromEntries,
  PathValue,
} from "#i18n/index/types";
import resolve from "#i18n/resolve";
import sInternal from "#i18n/symbol/internal";
import validate from "#i18n/validate";
import sConfig from "#symbol/config";
import type { Dict, MaybePromise } from "@rcompat/type";

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
  let active_locale: Locale = config.defaultLocale;
  const currency = config.currency ?? "USD";
  const formatter = new Formatter(active_locale);

  // reactive core
  let version = 0;
  const subscribers = new Set<() => void>();
  const touch = () => {
    for (const subscriber of subscribers) {
      try {
        subscriber();
      } catch {
        // ignore
      }
    }
  };

  let persist_fn: ((locale: Locale) => MaybePromise<void>) | undefined;
  let loading: Promise<void> | null = null;

  const listeners = new Set<(locale: Locale) => void>();
  const notify = (locale: Locale) => {
    for (const fn of listeners) fn(locale);
  };

  function apply(locale: Locale, options: {
    emit?: boolean; persist?: boolean;
  } = {}) {
    const { emit = false, persist = false } = options;
    if (locale === active_locale) return;

    active_locale = locale;
    formatter.locale = locale;
    version++;

    if (emit) notify(locale);

    if (persist && persist_fn) {
      const run = async (l: Locale) => { await persist_fn!(l); };
      loading = run(locale)
        .catch(e => { console.warn("[i18n]: persist failed", e); })
        .finally(() => {
          loading = null;
          version++;
          notify(active_locale);
        });
    }
  }

  const set = (locale: Locale) => apply(locale, {
    emit: true, persist: true,
  });
  const init = (locale: Locale) => apply(locale);

  const mode = config.persist ?? DEFAULT_PERSIST_MODE;

  if (mode === "cookie") {
    persist_fn = async (locale: Locale) => {
      const res = await fetch("/", {
        method: PERSIST_METHOD, headers: { [PERSIST_HEADER]: locale },
      });
      if (!res.ok) throw new Error(`[i18n] persist failed: ${res.status}`);
    };
  } else if (mode === "localStorage") {
    persist_fn = (locale: Locale) => {
      try {
        localStorage.setItem(PERSIST_STORAGE_KEY, locale);
      } catch { } // ignore
    };
  } else if (mode === "sessionStorage") {
    persist_fn = (locale: Locale) => {
      try {
        sessionStorage.setItem(PERSIST_STORAGE_KEY, locale);
      } catch { } // ignore
    };
  } // no persistence

  function storage_restore() {
    const mode = config.persist ?? DEFAULT_PERSIST_MODE;
    if (mode === "localStorage" || mode === "sessionStorage") {
      try {
        const store = mode === "localStorage" ? localStorage : sessionStorage;
        const saved = store.getItem(PERSIST_STORAGE_KEY) as Locale | null;
        if (saved && (saved as string) in catalogs) {
          set(saved as Locale);
        }
      } catch { } //
    }
  }

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
    touch(); // reactive read

    const [key, params] = args as [string, Dict?];
    const translated =
      resolve(catalogs[active_locale], key) ??
      resolve(default_catalog, key) ??
      String(key);

    if (typeof translated === "string") {
      return format(translated, params ?? {}, currency, formatter) as Result<K>;
    }
    return translated as Result<K>;

  }

  type TFn = typeof t;
  type Translator = TFn & API<C>;
  type ReadableT = { subscribe(run: (value: Translator) => void): () => void };

  const api = t as Translator & ReadableT;

  api.onChange = (fn: (locale: Locale) => void) => {
    listeners.add(fn);
    try { fn(active_locale); } catch { } // ignore
    return () => { listeners.delete(fn); };
  };

  api.locale = {
    get: () => { touch(); return active_locale; },
    set,
  };

  Object.defineProperty(api, "loading", {
    get: () => { touch(); return loading !== null; },
  });
  Object.defineProperty(api, sConfig, {
    get: () => config,
  });

  Object.defineProperty(api, sInternal, {
    value: {
      init,
      wait: () => loading ?? Promise.resolve(),
      depend(fn: () => void) {
        subscribers.add(fn);
        return () => subscribers.delete(fn);
      },
      get version() { return version; },
      touch,
      restore: storage_restore,
    },
  });

  // svelte-style store interface
  api.subscribe = (run: (value: Translator) => void) => {
    return api.onChange(() => run(api));
  };

  return api;
}
