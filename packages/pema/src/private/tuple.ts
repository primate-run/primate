import type NormalizeSchema from "#NormalizeSchema";
import type Schema from "#Schema";
import TupleType from "#TupleType";
import normalize from "#normalize";

type NormalizeSchemaArray<T extends Schema[]> = {
  [K in keyof T]: NormalizeSchema<T[K]>;
};

function vanilla<const T extends Schema[]>(
  ...items: T
): TupleType<NormalizeSchemaArray<T>>;
function vanilla(...items: Schema[]) {
  // normalize each item so the class only sees Parsed
  const parsed = items.map(normalize) as never;
  return new TupleType(parsed);
}

function loose<const T extends Schema[]>(
  ...items: T
): TupleType<NormalizeSchemaArray<T>, true>;
function loose(...items: Schema[]) {
  const parsed = items.map(normalize) as never;
  return new TupleType(parsed, true);
}

function strict<const T extends Schema[]>(
  ...items: T
): TupleType<NormalizeSchemaArray<T>, false>;
function strict(...items: Schema[]) {
  const parsed = items.map(normalize) as never;
  return new TupleType(parsed, false);
}

const tuple = { vanilla, loose, strict };

export default tuple;
