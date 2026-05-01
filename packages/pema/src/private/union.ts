import Loose from "#Loose";
import type NormalizeSchema from "#NormalizeSchema";
import type Schema from "#Schema";
import UnionType from "#UnionType";
import normalize from "#normalize";

type NormalizeArray<T extends Schema[]> = {
  [K in keyof T]: NormalizeSchema<T[K]>;
};

function vanilla(): UnionType<[]>;
function vanilla<const T extends Schema[]>(
  ...types: T
): UnionType<NormalizeArray<T>>;

function vanilla(...types: Schema[]) {
  return new UnionType(types.map(normalize));
}

function loose(): UnionType<[]>;
function loose<const T extends Schema[]>(
  ...types: T
): UnionType<NormalizeArray<T>>;

function loose(...types: Schema[]) {
  const i = new UnionType(types.map(normalize));
  i[Loose] = true;
  return i;
}

function strict(): UnionType<[]>;
function strict<const T extends Schema[]>(
  ...types: T
): UnionType<NormalizeArray<T>>;

function strict(...types: Schema[]) {
  const i = new UnionType(types.map(normalize));
  i[Loose] = false;
  return i;
}

const union = { vanilla, loose, strict };

export default union;
