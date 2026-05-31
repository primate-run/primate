import request from "#request/store";
import type {
  BridgedTranslator,
  HeadlessTranslator,
  LocaleOf,
  RestoreRequest,
  SetLocaleOf,
} from "@primate/core/i18n";
import { ref, watch } from "vue";

export default function i18n<const T extends HeadlessTranslator>(
  source: T,
): BridgedTranslator<T> {
  const version = ref(0);

  const notify = () => { version.value += 1; };

  const depend = () => {
    void version.value;
  };

  const restore = (next?: RestoreRequest) => {
    const before = source.locale.get();

    source.restore(next);

    if (source.locale.get() !== before) notify();
  };

  const get = () => {
    depend();
    return source.locale.get() as LocaleOf<T>;
  };
  const set = (locale: SetLocaleOf<T>) => {
    const before = source.locale.get();

    source.locale.set(locale);

    if (source.locale.get() !== before) {
      notify();
    }
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

  restore(request.value as RestoreRequest | undefined);

  watch(request, next => {
    restore(next as RestoreRequest | undefined);
  }, { immediate: false });

  return value;
}
