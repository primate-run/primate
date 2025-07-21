import ArrayType from "#ArrayType";
import type Validated from "#Validated";

/**
* Value is an array of the given type.
*/
export default <const T extends Validated<unknown>>(t: T) => new ArrayType(t);
