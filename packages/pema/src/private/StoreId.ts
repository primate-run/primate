import type StoreSchema from "#StoreSchema";
import type Validated from "#Validated";
import type Infer from "#Infer";

type StoreId<T extends StoreSchema> =
  T["id"] extends Validated<unknown> ? Infer<T["id"]> : never;

export type { StoreId as default };
