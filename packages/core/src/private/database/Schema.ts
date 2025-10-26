import type InferStoreOut from "pema/InferStoreOut";
import type StoreSchema from "pema/StoreSchema";
;
type X<T> = {
  [K in keyof T]: T[K]
} & {};

type Schema<T extends StoreSchema> = X<InferStoreOut<T>>;

export type { Schema as default };
