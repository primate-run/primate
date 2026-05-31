import type I18NModule from "#I18NModule";
import request from "#request/store";
import type {
  BridgedTranslator,
  HeadlessTranslator,
  LocaleOf,
  RestoreRequest,
  SetLocaleOf,
} from "@primate/core/i18n";

export default function i18n<const T extends HeadlessTranslator>(
  source: T,
): BridgedTranslator<T> {
  let invalidate: () => void = () => undefined;
  let forced: string | undefined;

  const get = () => source.locale.get() as LocaleOf<T>;

  const set = (locale: SetLocaleOf<T>) => {
    forced = locale as string;
    source.locale.set(locale);
    invalidate();
  };

  const restore = (next?: RestoreRequest) => {
    const before = source.locale.get();
    source.restore(next);

    if (forced !== undefined) {
      source.locale.set(forced as any);
      return;
    }

    if (source.locale.get() !== before) invalidate();
  };

  const value = ((...args: Parameters<T>) => {
    return source(...args);
  }) as BridgedTranslator<T> & I18NModule;

  value.defaultLocale = source.defaultLocale;
  value.locales = source.locales;
  value.catalogs = source.catalogs;
  value.currency = source.currency;
  value.locale = { get, set };
  value.restore = restore;
  value.invalidate = (fn: () => void) => { invalidate = fn; };

  source.restore();

  request.subscribe(next => {
    restore(next as RestoreRequest | undefined);
  });

  ((globalThis as any).__primate_i18n__ ??= []).push(value);

  return value;
}
