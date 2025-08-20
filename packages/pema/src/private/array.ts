import ArrayType from "#ArrayType";
import type Parsed from "#Parsed";

/**
* Value is an array of the given subtype.
*/
export default function array<const T extends Parsed<unknown>>(subtype: T) {
  return new ArrayType(subtype);
}
