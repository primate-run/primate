import ArrayType from "#ArrayType";
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
  ArrayType<NormalizeSchema<S>, true> {
  return new ArrayType(normalize(of), true);
};

const strict = function array<const S extends Schema>(of: S):
  ArrayType<NormalizeSchema<S>, false> {
  return new ArrayType(normalize(of), false);
};

const array = { strict, loose, vanilla };

export default array;
