import HasManyRelation from "#orm/HasManyRelation";
import type StoreRef from "#orm/StoreRef";
import type { StoreSchema } from "pema";

export default function hasMany<S extends StoreSchema, FK extends string>(
  store: StoreRef<S>,
  fk: FK,
): HasManyRelation<S, FK> {
  return new HasManyRelation(store, fk);
}
