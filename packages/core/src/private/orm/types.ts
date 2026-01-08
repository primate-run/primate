import type BelongsToRelation from "#orm/BelongsToRelation";
import type ForeignKey from "#orm/ForeignKey";
import type HasManyRelation from "#orm/HasManyRelation";
import type HasOneRelation from "#orm/HasOneRelation";
import type PrimaryKey from "#orm/PrimaryKey";
import type { Dict } from "@rcompat/type";
import type { DataKey, InferStore, Storable } from "pema";

type Relation =
  | BelongsToRelation<any, any>
  | HasManyRelation<any, any>
  | HasOneRelation<any, any>;

type StoreField =
  | Storable<DataKey>
  | PrimaryKey<Storable<DataKey>>
  | ForeignKey<Storable<DataKey>>
  | Relation;

type StoreInput = Dict<StoreField>;

type PrimaryKeyField<T extends StoreInput> = {
  [K in keyof T]: T[K] extends PrimaryKey<any> ? K : never
}[keyof T] & keyof InferRecord<T>;

type ExtractSchema<T extends StoreInput> = {
  [K in keyof T as T[K] extends Relation ? never : K]:
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
