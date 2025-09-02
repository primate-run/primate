import type Infer from "#Infer";
import type Parsed from "#Parsed";
import type StoreSchema from "#StoreSchema";

type StoreId<T extends StoreSchema> =
  T["id"] extends Parsed<unknown> ? NonNullable<Infer<T["id"]>> : never;

export type { StoreId as default };
