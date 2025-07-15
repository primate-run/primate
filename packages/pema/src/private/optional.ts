import OptionalType from "#OptionalType";
import type Validated from "#Validated";

export default <const T extends Validated<unknown>>(type: T) =>
  new OptionalType(type);
