import type InferStore from "pema/InferStore";
import type StoreSchema from "pema/StoreSchema";

type X<T> = {
  [K in keyof T]: T[K]
} & {};

// NB: the name of this type has been selected to avoid collision with
// TypeScript's built-in Record type, and the Document type in the DOM
type DataRecord<T extends StoreSchema> = X<InferStore<T>>;

export type { DataRecord as default };
