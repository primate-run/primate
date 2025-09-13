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
  let activeLocale: Locale = config.defaultLocale;
  const currency = config.currency ?? "USD";
  const formatter = new Formatter(activeLocale);
  const defaultCatalog = catalogs[config.defaultLocale] as Schema;

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

  let persistFn: ((locale: Locale) => MaybePromise<void>) | undefined;
  let loading: Promise<void> | null = null;

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
        .finally(() => {
          loading = null;
          version++;
          notify(activeLocale);
        });
    }
  }

  const set = (locale: Locale) => apply(locale, {
    emit: true, persist: true,
  });
  const init = (locale: Locale) => apply(locale);

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
        } catch { } // ignore
      };
    } else if (mode === "sessionStorage") {
      persistFn = (locale: Locale) => {
        try {
          sessionStorage.setItem(PERSIST_STORAGE_KEY, locale);
        } catch { } // ignore
      };
    } // no persistence
  }

  function storageRestore() {
    if (typeof window === "undefined") return;
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

    const [key, maybeParams] = args as [Key, Dict?];

    const active = catalogs[activeLocale];
    let template =
      (active && active[key]) ??
      (defaultCatalog && defaultCatalog[key]) ??
      String(key);

    const params = (maybeParams ?? {}) as Dict;

    // save escaped braces
    template = template.replace(/\{\{/g, "\uE000");
    template = template.replace(/\}\}/g, "\uE001");

    // Process normal parameters with nested brace support
    const template_re = /\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g;
    template = template.replace(template_re, (_, body: string) => {
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
      const m = /^(?:u|unit)\(([^)]+)\)$/.exec(head);
      if (m) return formatter.unit(Number(value ?? 0), m[1]);

      switch (head) {
        case "n":
        case "number": {
          if (tail) {
            const options = tail.split("|");
            const n = Number(value ?? 0);
            const formatted = formatter.number(n);
            const plural = () => {
              const category = Number.isFinite(n)
                ? formatter.pluralRules().select(n)
                : "other";
              if (options.length === 2) {
                const [one, other] = options;
                return category === "one" ? one : other;
              }
              if (options.length === 3) {
                const [zero, one, other] = options;
                return n === 0 ? zero : (category === "one" ? one : other);
              }
              if (options.length === 5) {
                const [zero, one, few, many, other] = options;
                if (n === 0) return zero;
                switch (category) {
                  case "one": return one;
                  case "few": return few;
                  case "many": return many;
                  default: return other;
                }
              }
              return formatted;
            };
            return plural().replace(new RegExp(`\\{${name}\\}`, "g"), formatted);
          }
          return formatter.number(Number(value ?? 0));
        }

        case "d":
        case "date": {
          const d = typeof value === "number"
            ? new Date(value)
            : value instanceof Date ? value : new Date(NaN);
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
          return formatter.list(Array.isArray(value) ? value : []);

        default:
          return value == null ? "" : String(value);
      }
    });

    // restore escaped braces
    template = template.replace(/\uE000/g, "{");
    template = template.replace(/\uE001/g, "}");

    return template;
  }

  type TFn = typeof t;
  type Translator = TFn & API<C>;
  type ReadableT = { subscribe(run: (value: Translator) => void): () => void };

  const api = t as Translator & ReadableT;

  api.onChange = (fn: (locale: Locale) => void) => {
    listeners.add(fn);
    try { fn(activeLocale); } catch { } // ignore
    return () => { listeners.delete(fn); };
  };

  api.locale = {
    get: () => { touch(); return activeLocale; },
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
      restore: storageRestore,
    },
  });

  // svelte-style store interface
  api.subscribe = (run: (value: Translator) => void) => {
    return api.onChange(() => run(api));
  };

  return api;
}
