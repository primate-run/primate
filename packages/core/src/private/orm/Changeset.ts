import type { ExtractSchema, StoreInput } from "#orm/types";
import type { InferStore } from "pema";

type X<T> = {
  [K in keyof T]: T[K]
} & {};

type OrNull<T> = {
  [P in keyof T]?: null | T[P];
};

type Changeset<T extends StoreInput> = X<OrNull<InferStore<ExtractSchema<T>>>>;

export type { Changeset as default };
