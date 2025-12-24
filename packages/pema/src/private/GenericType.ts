import Parsed from "#Parsed";
import type { PrintableGeneric } from "@rcompat/type";

export default abstract class GenericType<Type, Inferred, Name extends string>
  extends Parsed<Inferred>
  implements PrintableGeneric<Type> {

  get Name(): Name {
    return undefined as unknown as Name;
  }

  get Type(): Type {
    return undefined as unknown as Type;
  }
}
