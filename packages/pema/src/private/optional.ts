import OptionalType from "#OptionalType";
import type Parsed from "#Parsed";

export default <const T extends Parsed<unknown>>(type: T) =>
  new OptionalType(type);
