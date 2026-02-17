import type ForeignKey from "#orm/ForeignKey";
import type PrimaryKey from "#orm/PrimaryKey";
import type StoreInput from "#orm/StoreInput";
import type { DataKey, Storable } from "pema";

type ExtractSchema<T extends StoreInput> = {
  [K in keyof T]:
  T[K] extends PrimaryKey<infer P> ? P :
  T[K] extends ForeignKey<infer P> ? P :
  T[K] extends Storable<DataKey> ? T[K] :
  never;
};

export type { ExtractSchema as default };
