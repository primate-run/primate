import type Database from "#db/Database";
import type Store from "#db/Store";
import derive from "#db/symbol/derive";
import type Dict from "@rcompat/type/Dict";
import type StoreSchema from "pema/StoreSchema";
import type Module from "#db/Module";

type Config = { default: Module } & Dict<Module>;

export default <T extends StoreSchema>(config: Config) => {
  let databases: { default: Database } & Dict<Database>;
  // open databases
  return {
    async wrap(name: string, store: Store<T>) {
      databases = Object.fromEntries(await Promise.all(Object.entries(config)
        .map(async ([key, module]) => [key, await module.init()])));

      return store[derive](name, databases.default);
    },
  };
};
