import GenericType from "#GenericType";
import type Storable from "#Storable";

const storable = (x: unknown): x is Storable =>
  !!x && typeof x === "object" && "datatype" in x;

export default abstract class VirtualType<
  Type,
  Inferred,
  Name extends string,
> extends GenericType<Type, Inferred, Name> {

  abstract get schema(): Type;

  get datatype() {
    if (storable(this.schema)) return this.schema.datatype;

    throw new Error("cannot be used in a store");
  }
}
