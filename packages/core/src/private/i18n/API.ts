import type Catalog from "#i18n/Catalog";
import type Catalogs from "#i18n/Catalogs";
import type {
  DotPaths,
  EntriesOf,
  ParamsFromEntries,
  PathValue,
} from "#i18n/types";

type RestoreRequest = {
  cookies?: Record<string, string | undefined>;
};

export type Schema<C extends Catalogs> = C[keyof C] extends Catalog
  ? C[keyof C]
  : never;

export type Key<C extends Catalogs> = DotPaths<Schema<C>> & string;

type Resolved<C extends Catalogs, K extends string> =
  [K] extends [Key<C>] ? PathValue<Schema<C>, K> : never;

type Message<C extends Catalogs, K extends Key<C>> =
  Extract<Resolved<C, K>, string>;

type Params<C extends Catalogs, K extends Key<C>> =
  ParamsFromEntries<EntriesOf<Message<C, K>>>;

export type Args<C extends Catalogs, K extends string> =
  K extends Key<C>
  ? ([EntriesOf<Message<C, K>>] extends [never]
    ? [key: K]
    : [key: K, params: Params<C, K>])
  : [`[i18n] Missing locale key "${K & string}".`];

export type Result<C extends Catalogs, K extends string> =
  K extends Key<C>
  ? (Resolved<C, K> extends string ? string : Resolved<C, K>)
  : string;

export type TFn<C extends Catalogs> =
  <K extends string>(...args: Args<C, K>) => Result<C, K>;

export default interface API<C extends Catalogs> {
  defaultLocale: keyof C & string;
  locales: readonly (keyof C & string)[];
  catalogs: C;
  currency: string;
  locale: {
    get(): keyof C & string;
    set(locale: keyof C & string): void;
  };
  restore(request?: RestoreRequest): void;
  with(locale: keyof C & string): TFn<C>;
}
