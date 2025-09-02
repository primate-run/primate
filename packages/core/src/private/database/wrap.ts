import type Database from "#database/Database";
import type Store from "#database/Store";
import wrap from "#database/symbol/wrap";
import type StoreSchema from "pema/StoreSchema";

export default function wrapStore<T extends StoreSchema>(
  name: string,
  store: Store<T>,
  database: Database,
) {
  return store[wrap](name, database);
}
