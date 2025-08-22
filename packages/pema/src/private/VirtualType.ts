import GenericType from "#GenericType";
import type Storeable from "#Storeable";

const storeable = (x: unknown): x is Storeable =>
  !!x && typeof x === "object" && "datatype" in x;

export default abstract class VirtualType<
  Type,
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
