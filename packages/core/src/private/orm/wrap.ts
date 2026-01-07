import type DB from "#db/DB";
import wrap from "#db/symbol/wrap";
import type Store from "#orm/Store";
import type { StoreSchema } from "pema";

export default function wrapStore<T extends StoreSchema>(
  name: string,
  store: Store<T>,
  db: DB,
) {
  return store[wrap](name, db);
}
