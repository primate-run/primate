import type StoreSchema from "#StoreSchema";
import type Validated from "#Validated";
import type UndefinedToOptional from "@rcompat/type/UndefinedToOptional";

type StoreValue<T> = T extends Validated<infer U> ? U : never;

type InferStore<T extends StoreSchema> = UndefinedToOptional<{
  [K in keyof T]: StoreValue<T[K]>;
}>;

export type { InferStore as default };
