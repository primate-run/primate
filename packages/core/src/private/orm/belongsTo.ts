import BelongsToRelation from "#orm/BelongsToRelation";
import type StoreRef from "#orm/StoreRef";
import type { StoreSchema } from "pema";

export default function belongsTo<S extends StoreSchema, FK extends string>(
  store: StoreRef<S>,
  fk: FK,
): BelongsToRelation<S, FK> {
  return new BelongsToRelation(store, fk);
}
