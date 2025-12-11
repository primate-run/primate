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
import sInternal from "#i18n/symbol/internal";
import type TypeOf from "#i18n/TypeOf";
import sConfig from "#symbol/config";
import type Dict from "@rcompat/type/Dict";
import type MaybePromise from "@rcompat/type/MaybePromise";

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

  function t<K extends string>(...args: Args<K>): string {
    touch(); // reactive read

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
