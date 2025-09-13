import ArrayType from "#ArrayType";
import normalize from "#normalize";
import type NormalizeSchema from "#NormalizeSchema";
import type Schema from "#Schema";

/**
* Value is an array of the given type.
*/
export default function array<const S extends Schema>(of: S):
  ArrayType<NormalizeSchema<S>> {
  return new ArrayType(normalize(of));
}
