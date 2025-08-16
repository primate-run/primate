import type Parsed from "#Parsed";
import type StoreSchema from "#StoreSchema";
import type UndefinedToOptional from "@rcompat/type/UndefinedToOptional";

type StoreValue<T> = T extends Parsed<infer U> ? U : never;

type InferStore<T extends StoreSchema> = UndefinedToOptional<{
  [K in keyof T]: StoreValue<T[K]>;
}>;

export type { InferStore as default };
