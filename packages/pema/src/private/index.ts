import array from "#array";
import constructor from "#constructor";
import is_validated_type from "#is_validated_type";
import literal from "#literal";
import type NormalizeSchema from "#NormalizeSchema";
import null_type from "#null";
import type Schema from "#Schema";
import SchemaType from "#SchemaType";
import tuple from "#tuple";
import undefined_type from "#undefined";
import type AbstractConstructor from "@rcompat/type/AbstractConstructor";

const is_constructor = (value: unknown): value is AbstractConstructor => {
  try {
    if (typeof value !== "function") return false;

    new (value as { new (): unknown })();
    return true;
  } catch {
    return false;
  }
};
export default function schema<const S extends Schema>(s: S):
SchemaType<NormalizeSchema<S>> {
  if (s === null) {
    return new SchemaType(null_type) as never;
  }
  if (s === undefined) {
    return new SchemaType(undefined_type) as never;
  }
  if (typeof s === "string") {
    return new SchemaType(literal(s)) as never;
  }
  if (is_constructor(s)) {
    return new SchemaType(constructor(s)) as never;
  }
  if (Array.isArray(s)) {
    if (s.length === 1 && is_validated_type(s[0])) {
      return new SchemaType(array(s[0])) as never;
    } else {
      return new SchemaType(tuple(...s)) as never;
    }
  }
  type Normalized = NormalizeSchema<typeof s>;

  return new SchemaType<Normalized>(s as Normalized);
}
