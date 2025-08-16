import GenericType from "#GenericType";
import type Parsed from "#Parsed";
import type Storeable from "#Storeable";

const storeable = (x: Parsed<unknown> | undefined): x is Storeable =>
  !!x && "datatype" in x;

export default abstract class VirtualType<
  Type extends Parsed<unknown> | undefined,
  Inferred,
  Name extends string,
> extends GenericType<Type, Inferred, Name> {

  abstract get schema(): Type;

  get datatype() {
    if (storeable(this.schema)) {
      return this.schema.datatype;
    }
    throw new Error("cannot be used in a store");
  }
}
