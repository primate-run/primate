import ArrayType from "#ArrayType";
import type Parsed from "#Parsed";

/**
* Value is an array of the given type.
*/
export default <const T extends Parsed<unknown>>(t: T) => new ArrayType(t);
