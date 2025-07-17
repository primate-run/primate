import type Infer from "#Infer";
import type StoreSchema from "#StoreSchema";
import type Validated from "#Validated";
import type UndefinedToOptional from "@rcompat/type/UndefinedToOptional";

type InferStore<T extends StoreSchema> = UndefinedToOptional<{
  [K in keyof T]: T[K] extends Validated<unknown>
    ? Infer<T[K]>
    : "store-never"
}>;

export type { InferStore as default };
