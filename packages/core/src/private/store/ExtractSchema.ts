import type ForeignKey from "#store/ForeignKey";
import type PrimaryKey from "#store/PrimaryKey";
import type { ManyRelation, OneRelation } from "#store/relation";
import type StoreInput from "#store/StoreInput";
import type { DataKey, Storable } from "pema";

type ExtractSchema<T extends StoreInput> = {
  [K in keyof T as T[K] extends OneRelation<string, string> | ManyRelation<string, string> ? never : K]:
  T[K] extends PrimaryKey<infer P> ? P :
  T[K] extends ForeignKey<infer P> ? P :
  T[K] extends Storable<DataKey> ? T[K] :
  never;
};

export type { ExtractSchema as default };
