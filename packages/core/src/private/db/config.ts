import type Database from "#db/Database";
import type Store from "#db/Store";
import derive from "#db/symbol/derive";
import type PartialDict from "@rcompat/type/PartialDict";
import type StoreSchema from "pema/StoreSchema";

type Config<T extends StoreSchema> = {
  default: Database<T>;
} & PartialDict<Database<T>>;

export default <T extends StoreSchema>(config: Config<T>) => {
  const drivers = config;

  return {
    wrap(name: string, store: Store<T>) {
      return store[derive](name, drivers.default);
    },
  };
};
