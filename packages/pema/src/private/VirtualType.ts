import GenericType from "#GenericType";
import type Storeable from "#Storeable";
import type Validated from "#Validated";

const storeable = (x: undefined | Validated<unknown>): x is Storeable =>
  !!x && "datatype" in x && "normalize" in x;

export default abstract class VirtualType<
  Type extends undefined | Validated<unknown>,
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

  normalize(value: Inferred) {
    if (storeable(this.schema)) {
      return this.schema.normalize(value);
    }
    throw new Error("cannot be used in a store");
  }
}
