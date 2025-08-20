import type OptionalType from "#OptionalType";
import Parsed from "#Parsed";

export default abstract class OptionalTrait extends Parsed<unknown> {
  /**
  * Value is optional.
  */
  abstract optional(): OptionalType<this>;
}
