import type { InferStore, StoreSchema } from "pema";

type X<T> = {
  [K in keyof T]: T[K]
} & {};
type OrNull<T> = {
  [P in keyof T]?: null | T[P];
};
type Changeset<T extends StoreSchema> = X<OrNull<InferStore<T>>>;

export type { Changeset as default };
