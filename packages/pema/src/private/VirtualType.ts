import GenericType from "#GenericType";
import Storable from "#Storable";

export default abstract class VirtualType<
  Type,
  Inferred,
  Name extends string,
> extends GenericType<Type, Inferred, Name> {

  abstract get schema(): Type;

  get datatype() {
    if (Storable.is(this.schema)) return this.schema.datatype;

    throw new Error("cannot be used in a store");
  }
}
