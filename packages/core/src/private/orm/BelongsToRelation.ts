import type StoreRef from "#orm/StoreRef";
import type { StoreSchema } from "pema";

export default class BelongsToRelation<
  S extends StoreSchema,
  FK extends string,
> {
  #store: StoreRef<S>;
  #fk: FK;

  constructor(store: StoreRef<S>, fk: FK) {
    this.#store = store;
    this.#fk = fk;
  }

  get store() {
    const ref = this.#store;
    return typeof ref === "function" ? ref() : ref;
  }

  get fk() {
    return this.#fk;
  }
}
