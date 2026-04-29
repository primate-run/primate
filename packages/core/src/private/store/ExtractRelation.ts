import type StoreInput from "#store/StoreInput";
import type { ManyRelation, OneRelation } from "#store/relation";

type ExtractRelations<T extends StoreInput> = {
  [K in keyof T as T[K] extends OneRelation<string, string> | ManyRelation<string, string> ? K : never]:
  T[K] extends OneRelation<string, string> | ManyRelation<string, string> ? T[K] : never;
};

export type { ExtractRelations as default };
