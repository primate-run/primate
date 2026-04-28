import type ForeignKey from "#store/ForeignKey";
import type PrimaryKey from "#store/PrimaryKey";
import type StoreInput from "#store/StoreInput";
import type { DataKey, Storable } from "pema";

type ExtractSchema<T extends StoreInput> = {
  [K in keyof T]:
  T[K] extends PrimaryKey<infer P> ? P :
  T[K] extends ForeignKey<infer P> ? P :
  T[K] extends Storable<DataKey> ? T[K] :
  never;
};

export type { ExtractSchema as default };
