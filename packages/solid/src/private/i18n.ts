import { request } from "#request/store";
import type {
  BridgedTranslator,
  HeadlessTranslator,
  LocaleOf,
  RestoreRequest,
  SetLocaleOf,
} from "@primate/core/i18n";
import { createSignal } from "solid-js";

export default function i18n<const T extends HeadlessTranslator>(
  source: T,
): BridgedTranslator<T> {
  const [version, setVersion] = createSignal(0);

  let restored = false;
  let restored_request: RestoreRequest | undefined;

  const current_request = () => request() as RestoreRequest | undefined;

  const restore_from_request = () => {
    const next = current_request();

    if (restored && next === restored_request) return;

    restored = true;
    restored_request = next;
    source.restore(next);
  };

  const depend = () => {
    version();
    restore_from_request();
  };

  const restore = (next: RestoreRequest | undefined = current_request()) => {
    const before = source.locale.get();

    restored = true;
    restored_request = next;
    source.restore(next);

    if (source.locale.get() !== before) setVersion(v => v + 1);
  };

  const get = () => {
    depend();
    return source.locale.get() as LocaleOf<T>;
  };

  const set = (locale: SetLocaleOf<T>) => {
    const before = source.locale.get();

    source.locale.set(locale);

    if (source.locale.get() !== before) setVersion(v => v + 1);
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

  restore();

  return value;
}
