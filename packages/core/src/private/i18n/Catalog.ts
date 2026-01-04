import type { Dict } from "@rcompat/type";

type CatalogValue =
  | string
  | { [key: string]: CatalogValue }
  | CatalogValue[]
  ;
type Catalog = Dict<CatalogValue>;

export type { Catalog as default };
