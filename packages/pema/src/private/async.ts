import AsyncType from "#AsyncType";
import normalize from "#normalize";
import type { NormalizeSchemaObject } from "#NormalizeSchema";
import type ObjectType from "#ObjectType";
import type Schema from "#Schema";
import type { Dict } from "@rcompat/type";

function async_schema<const S extends Dict<Schema>>(
  schema: S,
): AsyncType<
  NormalizeSchemaObject<S>,
  undefined,
  ObjectType<NormalizeSchemaObject<S>>["infer"]
> {
  return new AsyncType(normalize(schema)) as never;
}

export default async_schema;
