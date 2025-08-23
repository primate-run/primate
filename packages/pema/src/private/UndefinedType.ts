import PrimitiveType from "#PrimitiveType";

type Name = "UndefinedType";

export default class UndefinedType extends PrimitiveType<undefined, Name> {
  get name() {
    return "undefined";
  }
}
