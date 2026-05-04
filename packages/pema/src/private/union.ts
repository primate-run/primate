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

function loose(): UnionType<[], true>;
function loose<const T extends Schema[]>(
  ...types: T
): UnionType<NormalizeArray<T>, true>;
function loose(...types: Schema[]) {
  return new UnionType(types.map(normalize), true);
}

function strict(): UnionType<[], false>;
function strict<const T extends Schema[]>(
  ...types: T
): UnionType<NormalizeArray<T>, false>;

function strict(...types: Schema[]) {
  return new UnionType(types.map(normalize), false);
}

const union = { vanilla, loose, strict };

export default union;
