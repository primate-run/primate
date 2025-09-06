import type Catalog from "#i18n/Catalog";

type Catalogs<Locale extends string = string> = Record<Locale, Catalog>;

export type { Catalogs as default };

