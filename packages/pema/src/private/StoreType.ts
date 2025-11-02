import ObjectType from "#ObjectType";
import PartialType from "#PartialType";
import type StoreSchema from "#StoreSchema";

export default class StoreType<S extends StoreSchema>
  extends ObjectType<S> {

  constructor(spec: S) {
    super(spec);
  }

  get name() {
    return "store";
  }

  partial() {
    return new PartialType(this.properties as any);
  }
}
