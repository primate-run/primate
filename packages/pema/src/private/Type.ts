import DefaultType from "#DefaultType";
import OptionalType from "#OptionalType";
import Parsed from "#Parsed";
import type DefaultTrait from "#trait/Default";
import type OptionalTrait from "#trait/Optional";
import type Printable from "@rcompat/type/Printable";

export default abstract class Type<T, Name extends string>
  extends Parsed<T>
  implements Printable, DefaultTrait<T>, OptionalTrait {

  optional() {
    return new OptionalType(this);
  }

  default<S extends T>(value: (() => S) | S) {
    return new DefaultType(this, value);
  }

  get Name(): Name {
    return undefined as unknown as Name;
  }
}
