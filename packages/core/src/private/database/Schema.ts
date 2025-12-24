import type { InferStoreOut, StoreSchema } from "pema";
;
type X<T> = {
  [K in keyof T]: T[K]
} & {};

type Schema<T extends StoreSchema> = X<InferStoreOut<T>>;

export type { Schema as default };
