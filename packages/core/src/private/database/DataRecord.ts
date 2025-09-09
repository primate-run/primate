import type InferStoreOut from "pema/InferStoreOut";
import type StoreSchema from "pema/StoreSchema";
;
type X<T> = {
  [K in keyof T]: T[K]
} & {};

// NB: name chosen to avoid collision with TS's builtin Record and DOM Document.
// persisted/output shape: all fields plus REQUIRED `id`.
type DataRecord<T extends StoreSchema> = X<InferStoreOut<T>>;

export type { DataRecord as default };
