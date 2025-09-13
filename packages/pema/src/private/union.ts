import type NormalizeSchema from "#NormalizeSchema";
import type Schema from "#Schema";
import UnionType from "#UnionType";
import normalize from "#normalize";

type NormalizeArray<T extends Schema[]> = {
  [K in keyof T]: NormalizeSchema<T[K]>;
};

export default function union(): UnionType<[]>;
export default function union<const T extends Schema[]>(
  ...types: T
): UnionType<NormalizeArray<T>>;

export default function union(...types: Schema[]) {
  return new UnionType(types.map(normalize));
}
