import Validated from "#Validated";
import type Printable from "@rcompat/type/Printable";
import type Infer from "#Infer";

export default abstract class StaticType<Type, Name extends string>
  extends Validated<Type>
  implements Printable {

  get Name(): Name {
    return undefined as unknown as Name;
  }

  validate(x: unknown): Infer<this> {
    // no validation of static types
    return x as Infer<this>;
  }
}
