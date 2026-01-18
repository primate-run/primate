import type ForeignKey from "#orm/ForeignKey";
import type PrimaryKey from "#orm/PrimaryKey";
import type { ManyRelation, OneRelation } from "#orm/relation";
import type { Dict } from "@rcompat/type";
import type { DataKey, InferStore, Storable } from "pema";

type Relation = OneRelation<any, string> | ManyRelation<any, string>;

type StoreField =
  | Storable<DataKey>
  | PrimaryKey<Storable<DataKey>>
  | ForeignKey<Storable<DataKey>>;

type StoreInput = Dict<StoreField>;

type PrimaryKeyField<T extends StoreInput> = {
  [K in keyof T]: T[K] extends PrimaryKey<any> ? K : never
}[keyof T] & keyof InferRecord<T>;

type ExtractSchema<T extends StoreInput> = {
  [K in keyof T]:
  T[K] extends PrimaryKey<infer P> ? P :
  T[K] extends ForeignKey<infer P> ? P :
  T[K] extends Storable<DataKey> ? T[K] :
  never;
};

type InferRecord<T extends StoreInput> = InferStore<ExtractSchema<T>>;

type Insertable<T extends StoreInput> =
  Omit<InferRecord<T>, PrimaryKeyField<T>> &
  Partial<Pick<InferRecord<T>, PrimaryKeyField<T>>>;

export type {
  ExtractSchema,
  InferRecord,
  Insertable,
  PrimaryKeyField,
  Relation,
  StoreField,
  StoreInput,
};
