import HasOneRelation from "#orm/HasOneRelation";
import type StoreRef from "#orm/StoreRef";
import type { StoreSchema } from "pema";

export default function hasOne<S extends StoreSchema, FK extends string>(
  store: StoreRef<S>,
  fk: FK,
): HasOneRelation<S, FK> {
  return new HasOneRelation(store, fk);
}
