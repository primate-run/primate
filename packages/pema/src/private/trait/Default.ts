import type DefaultType from "#DefaultType";
import Parsed from "#Parsed";

export default abstract class DefaultTrait<T> extends Parsed<unknown> {
  /**
  * Use the given default if value is missing.
  */
  abstract default(value: (() => T) | T): DefaultType<this, T>;
}
