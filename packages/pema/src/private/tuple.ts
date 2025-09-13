import type NormalizeSchema from "#NormalizeSchema";
import type Schema from "#Schema";
import TupleType from "#TupleType";
import normalize from "#normalize";

type NormalizeSchemaArray<T extends Schema[]> = {
  [K in keyof T]: NormalizeSchema<T[K]>;
};

export default function tuple<const T extends Schema[]>(
  ...items: T
): TupleType<NormalizeSchemaArray<T>>;
export default function tuple(...items: Schema[]) {
  // normalize each item so the class only sees Parsed
  const parsed = items.map(normalize) as never;
  return new TupleType(parsed);
}
