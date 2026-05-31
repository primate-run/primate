import locale from "#i18n/locale";
import type { Dict } from "@rcompat/type";

export type { default as API } from "#i18n/API";
export type { default as Catalogs } from "#i18n/Catalogs";
export type { default as ContextData } from "#i18n/ContextData";

export type RestoreRequest = {
  cookies?: Dict<string | undefined>;
};

export type HeadlessTranslator = {
  (...args: any[]): any;

  defaultLocale: string;
  locales: readonly string[];
  catalogs: Dict;
  currency: string;
  locale: {
    get(): string;
    set(locale: any): void;
  };

  restore(request?: RestoreRequest): void;
};

export type LocaleOf<T extends HeadlessTranslator> =
  T extends { locale: { get(): infer Locale } } ? Locale : string;

export type SetLocaleOf<T extends HeadlessTranslator> =
  T extends { locale: { set(locale: infer Locale): void } } ? Locale : never;

export type BridgedTranslator<T extends HeadlessTranslator> = T & {
  readonly locale: {
    get(): LocaleOf<T>;
    set(locale: SetLocaleOf<T>): void;
  };

  restore(request?: RestoreRequest): void;
};

const i18n = {
  locale,
};

export default i18n;
