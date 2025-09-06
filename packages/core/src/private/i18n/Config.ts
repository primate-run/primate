import type Catalogs from "#i18n/Catalogs";
import type PersistMode from "#i18n/PersistMode";

type Config<C extends Catalogs> = {
  defaultLocale: keyof C & string;
  locales: C;
  currency?: string;
  persist?: PersistMode;
};

export type { Config as default };
