import ArrayType from "#ArrayType";
import Loose from "#Loose";
import normalize from "#normalize";
import type NormalizeSchema from "#NormalizeSchema";
import type Schema from "#Schema";

/**
* Value is an array of the given type.
*/
const vanilla = function array<const S extends Schema>(of: S):
  ArrayType<NormalizeSchema<S>> {
  return new ArrayType(normalize(of));
};

const loose = function array<const S extends Schema>(of: S):
  ArrayType<NormalizeSchema<S>> {
  const i = new ArrayType(normalize(of));
  i[Loose] = true;
  return i;
};

const strict = function array<const S extends Schema>(of: S):
  ArrayType<NormalizeSchema<S>> {
  const i = new ArrayType(normalize(of));
  i[Loose] = false;
  return i;
};

const array = { strict, loose, vanilla };

export default array;
