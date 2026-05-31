import request from "#request/store";
import type {
  BridgedTranslator,
  HeadlessTranslator,
  LocaleOf,
  RestoreRequest,
  SetLocaleOf,
} from "@primate/core/i18n";

type Unsubscribe = () => void;
type Subscriber<T> = (value: T) => void;

type I18NStore<T extends HeadlessTranslator> = {
  subscribe(run: Subscriber<BridgedTranslator<T>>): Unsubscribe;

  defaultLocale: T["defaultLocale"];
  locales: T["locales"];
  catalogs: T["catalogs"];
  currency: T["currency"];

  locale: {
    get(): LocaleOf<T>;
    set(locale: SetLocaleOf<T>): void;
  };

  restore(request?: RestoreRequest): void;
};

export default function i18n<const T extends HeadlessTranslator>(
  source: T,
): I18NStore<T> {
  const subscribers = new Set<Subscriber<BridgedTranslator<T>>>();

  const notify = () => {
    for (const subscriber of subscribers) subscriber(value);
  };

  const get = () => source.locale.get() as LocaleOf<T>;
  const set = (locale: SetLocaleOf<T>) => {
    const before = source.locale.get();

    source.locale.set(locale);

    if (source.locale.get() !== before) notify();
  };

  const restore = (next?: RestoreRequest) => {
    const before = source.locale.get();

    source.restore(next);

    if (source.locale.get() !== before) notify();
  };

  const value = ((...args: Parameters<T>) => {
    return source(...args);
  }) as BridgedTranslator<T>;

  value.defaultLocale = source.defaultLocale;
  value.locales = source.locales;
  value.catalogs = source.catalogs;
  value.currency = source.currency;
  value.locale = { get, set };
  value.restore = restore;

  restore();

  request.subscribe(next => { restore(next as RestoreRequest | undefined); });

  return {
    subscribe(run) {
      subscribers.add(run);
      run(value);

      return () => { subscribers.delete(run); };
    },
    defaultLocale: source.defaultLocale,
    locales: source.locales,
    catalogs: source.catalogs,
    currency: source.currency,
    locale: { get, set },
    restore,
  };
}
