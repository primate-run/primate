import type Store from "#orm/Store";
import type { StoreInput } from "#orm/types";

/**
 * Extracts schema type from either a schema or a Store.
 */
type SchemaOf<T> = T extends Store<infer S, any> ? S : T;

/**
 * One relation (singular) - returns single record or null.
 *
 * Normal: FK is on the OTHER table, pointing to this table's PK.
 *   Example: Author has one Profile → Profile has author_id
 *
 * Reverse: FK is on THIS table, pointing to other table's PK.
 *   Example: Article belongs to Author → Article has author_id
 */
export type OneRelation<T extends StoreInput, FK extends string> = {
  type: "one";
  schema: T;
  fk: FK;
  reverse: boolean;
};

/**
 * Many relation (plural) - returns array of records.
 *
 * FK is always on the OTHER table, pointing to this table's PK.
 *   Example: Author has many Articles → Article has author_id
 */
export type ManyRelation<T extends StoreInput, FK extends string> = {
  type: "many";
  schema: T;
  fk: FK;
};

export type Relation = OneRelation<any, string> | ManyRelation<any, string>;

function is_store(value: unknown): value is Store<any, any> {
  return value !== null &&
    typeof value === "object" &&
    "schema" in value &&
    typeof (value as any).get === "function";
}

function extractSchema<T extends StoreInput | Store<any, any>>(
  schema_or_store: T,
): SchemaOf<T> {
  return (is_store(schema_or_store)
    ? schema_or_store.schema
    : schema_or_store) as SchemaOf<T>;
}

/**
 * Creates a "one" relation (singular).
 */
export function one<T extends StoreInput | Store<StoreInput, any>, FK extends string>(
  schemaOrStore: T,
  fk: FK,
  options?: { reverse?: boolean },
): OneRelation<SchemaOf<T>, FK> {
  return {
    type: "one",
    schema: extractSchema(schemaOrStore),
    fk,
    reverse: options?.reverse ?? false,
  };
}

/**
 * Creates a "many" relation (plural).
 */
export function many<T extends StoreInput | Store<StoreInput, any>, FK extends string>(
  schemaOrStore: T,
  fk: FK,
): ManyRelation<SchemaOf<T>, FK> {
  return {
    type: "many",
    schema: extractSchema(schemaOrStore),
    fk,
  };
}

export default { one, many };
