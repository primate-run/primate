import type InferStore from "pema/InferStore";
import type StoreSchema from "pema/StoreSchema";

type X<T> = {
  [K in keyof T]: T[K]
} & {};
type OrNull<T> = {
  [P in keyof T]: T[P] | null;
};
type Changes<T extends StoreSchema> = X<OrNull<InferStore<T>>>;

export type { Changes as default };
