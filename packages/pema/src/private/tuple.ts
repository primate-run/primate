import Loose from "#Loose";
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
): TupleType<NormalizeSchemaArray<T>>;
function loose(...items: Schema[]) {
  const parsed = items.map(normalize) as never;
  const i = new TupleType(parsed);
  i[Loose] = true;
  return i;
}

function strict<const T extends Schema[]>(
  ...items: T
): TupleType<NormalizeSchemaArray<T>>;
function strict(...items: Schema[]) {
  const parsed = items.map(normalize) as never;
  const i = new TupleType(parsed);
  i[Loose] = false;
  return i;
}

const tuple = { vanilla, loose, strict };

export default tuple;
