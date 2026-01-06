import type DB from "#db/DB";
import type Store from "#db/Store";
import wrap from "#db/symbol/wrap";
import type { StoreSchema } from "pema";

export default function wrapStore<T extends StoreSchema>(
  name: string,
  store: Store<T>,
  db: DB,
) {
  return store[wrap](name, db);
}
