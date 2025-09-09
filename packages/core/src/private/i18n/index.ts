import type API from "#i18n/API";
import type Catalog from "#i18n/Catalog";
import type Catalogs from "#i18n/Catalogs";
import type Config from "#i18n/Config";
import DEFAULT_PERSIST_MODE from "#i18n/constant/DEFAULT_PERSIST_MODE";
import PERSIST_HEADER from "#i18n/constant/PERSIST_HEADER";
import PERSIST_METHOD from "#i18n/constant/PERSIST_METHOD";
import PERSIST_STORAGE_KEY from "#i18n/constant/PERSIST_STORAGE_KEY";
import Formatter from "#i18n/Formatter";
import sInternal from "#i18n/symbol/internal";
import sConfig from "#symbol/config";
import type Dict from "@rcompat/type/Dict";
import type MaybePromise from "@rcompat/type/MaybePromise";

type Normalize<S extends string> =
  Lowercase<S extends `${infer A}|${string}` ? A : S>;

type TypeOf<T extends string> =
  Normalize<T> extends "n" | "number" ? number :
  Normalize<T> extends "d" | "date" ? Date | number :
  Normalize<T> extends "c" | "currency" ? number :
  Normalize<T> extends "o" | "ordinal" ? number :
  Normalize<T> extends "a" | "ago" ? number :
  Normalize<T> extends "l" | "list" ? string[] :
  Normalize<T> extends `u(${string})` | `unit(${string})` ? number :
  string;

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

  const catalogs: Catalogs = config.locales;
  let activeLocale: Locale = config.defaultLocale;
  const currency: string = config.currency ?? "USD";
  const formatter = new Formatter(activeLocale);
  const defaultCatalog = catalogs[config.defaultLocale] as Schema;

  // reactive core
  let version = 0;
  const dependReaders = new Set<() => void>();
  const touch = () => {
    for (const f of dependReaders) {
      try {
        f();
      } catch {
        /* ignore */
      }
    }
  };

  let persistFn: ((locale: Locale) => MaybePromise<void>) | undefined;
  let loading: Promise<void> | null = null;

  if (typeof window !== "undefined") {
    const mode = config.persist ?? DEFAULT_PERSIST_MODE;
    if (mode === "cookie") {
      persistFn = async (locale: Locale) => {
        const res = await fetch("/", {
          method: PERSIST_METHOD, headers: { [PERSIST_HEADER]: locale },
        });
        if (!res.ok) throw new Error(`[i18n] persist failed: ${res.status}`);
      };
    } else if (mode === "localStorage") {
      persistFn = (locale: Locale) => {
        try {
          localStorage.setItem(PERSIST_STORAGE_KEY, locale);
        } catch { /* ignore */ }
      };
    } else if (mode === "sessionStorage") {
      persistFn = (locale: Locale) => {
        try {
          sessionStorage.setItem(PERSIST_STORAGE_KEY, locale);
        } catch { /* ignore */ }
      };
    } // no persistence
  }

  const listeners = new Set<(locale: Locale) => void>();
  const notify = (locale: Locale) => {
    for (const fn of listeners) fn(locale);
  };

  function apply(locale: Locale, options: {
    emit?: boolean; persist?: boolean;
  } = {}) {
    const { emit = false, persist = false } = options;
    if (locale === activeLocale) return;

    activeLocale = locale;
    formatter.locale = locale;
    version++;

    if (emit) notify(locale);

    if (persist && persistFn) {
      const run = async (l: Locale) => { await persistFn!(l); };
      loading = run(locale)
        .catch(e => { console.warn("[i18n]: persist failed", e); })
        .finally(() => { loading = null; });
    }
  }

  const set = (locale: Locale) => apply(locale, {
    emit: true, persist: true,
  });
  const init = (locale: Locale) => apply(locale);

  type Args<K extends string> =
    K extends Key
    ? ([EntriesOf<Message<K>>] extends [never]
      ? [key: K]
      : [key: K, params: Params<K>])
    : [`[i18n] Missing locale key "${K & string}".`];

  function t<K extends string>(...args: Args<K>): string {
    touch(); // reactive read

    const [key, maybeParams] = args as [Key, Dict?];

    const active = catalogs[activeLocale];
    const template =
      (active && active[key]) ??
      (defaultCatalog && defaultCatalog[key]) ??
      String(key);

    const params = (maybeParams ?? {}) as Dict;

    return template.replace(/\{([^}]+)\}/g, (_, body: string) => {
      // name[:spec]
      let name = body;
      let spec: string | undefined;
      const colon = body.indexOf(":");
      if (colon >= 0) {
        name = body.slice(0, colon);
        spec = body.slice(colon + 1);
      }

      const value = params[name];

      if (!spec) return value == null ? "" : String(value);

      // number selection: "n|one|other" or "n|zero|one|other"
      const bar = spec.indexOf("|");
      const head = (bar === -1 ? spec : spec.slice(0, bar)).toLowerCase();
      const tail = bar === -1 ? "" : spec.slice(bar + 1);

      // units u(...)/unit(...)
      {
        const m = /^(?:u|unit)\(([^)]+)\)$/.exec(head);
        if (m) return formatter.unit(Number(value ?? 0), m[1]);
      }

      switch (head) {
        case "n":
        case "number": {
          if (tail) {
            const options = tail.split("|");
            const n = Number(value ?? 0);
            const cat = Number.isFinite(n)
              ? formatter.pluralRules().select(n)
              : "other";
            if (options.length === 2) {
              const [one, other] = options;
              return cat === "one" ? one : other;
            }
            if (options.length === 3) {
              const [zero, one, other] = options;
              if (n === 0) return zero;
              return cat === "one" ? one : other;
            }
            return formatter.number(n);
          }
          return formatter.number(Number(value ?? 0));
        }

        case "d":
        case "date": {
          const v = value as unknown;
          const d = typeof v === "number"
            ? new Date(v)
            : v instanceof Date ? v : new Date(NaN);
          return formatter.date(d);
        }

        case "c":
        case "currency":
          return formatter.currency(currency, Number(value ?? 0));

        case "o":
        case "ordinal":
          return formatter.ordinal(Number(value ?? 0));

        case "a":
        case "ago":
          return formatter.relative(Number(value ?? 0));

        case "l":
        case "list":
          return formatter.list(value);

        default:
          return value == null ? "" : String(value);
      }
    });
  }

  type TFn = typeof t;
  type Translator = TFn & API<C>;
  type ReadableT = { subscribe(run: (value: Translator) => void): () => void };

  const api = t as Translator & ReadableT;

  api.onChange = (fn: (locale: Locale) => void) => {
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  };

  api.locale = {
    get: () => { touch(); return activeLocale; },
    set,
  };

  Object.defineProperty(api, "loading", { get: () => loading !== null });

  Object.defineProperty(api, sConfig, {
    get: () => ({
      defaultLocale: config.defaultLocale,
      locales: config.locales,
      currency,
    }),
  });

  Object.defineProperty(api, sInternal, {
    value: {
      init,
      wait: () => loading ?? Promise.resolve(),
      depend(fn: () => void) {
        dependReaders.add(fn); return () => dependReaders.delete(fn);
      },
      get version() { return version; },
      touch,
    },
  });

  // svelte-style store interface
  api.subscribe = (run: (value: Translator) => void) => {
    run(api);
    const off = api.onChange(() => run(api));
    return () => off?.();
  };

  return api;
}
