import {
  get as get_request,
  subscribe as subscribe_request,
} from "#request/store";
import type {
  BridgedTranslator,
  HeadlessTranslator,
  LocaleOf,
  RestoreRequest,
  SetLocaleOf,
} from "@primate/core/i18n";
import { useSyncExternalStore } from "react";

type Unsubscribe = () => void;

function i18n<const T extends HeadlessTranslator>(
  source: T,
): BridgedTranslator<T> {
  let version = 0;
  const subscribers = new Set<() => void>();

  const subscribe = (subscriber: () => void): Unsubscribe => {
    subscribers.add(subscriber);

    return () => { subscribers.delete(subscriber); };
  };

  const snapshot = () => version;

  const notify = () => {
    version += 1;

    for (const subscriber of subscribers) subscriber();
  };

  const depend = () => {
    useSyncExternalStore(subscribe, snapshot, snapshot);
  };

  const restore = (request?: RestoreRequest) => {
    const before = source.locale.get();

    source.restore(request);

    if (source.locale.get() !== before) notify();
  };

  const get = () => {
    depend();
    return source.locale.get() as LocaleOf<T>;
  };

  const set = (locale: SetLocaleOf<T>) => {
    const before = source.locale.get();

    source.locale.set(locale);

    if (source.locale.get() !== before) notify();
  };

  const value = ((...args: Parameters<T>) => {
    depend();
    return source(...args);
  }) as BridgedTranslator<T>;

  value.defaultLocale = source.defaultLocale;
  value.locales = source.locales;
  value.catalogs = source.catalogs;
  value.currency = source.currency;
  value.locale = { get, set };
  value.restore = restore;

  restore(get_request() as RestoreRequest | undefined);

  subscribe_request(() => {
    restore(get_request() as RestoreRequest | undefined);
  });

  return value;
}

export default i18n;
