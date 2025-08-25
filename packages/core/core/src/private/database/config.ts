import type Database from "#database/Database";
import type Module from "#database/Module";
import type Store from "#database/Store";
import derive from "#database/symbol/derive";
import type Dict from "@rcompat/type/Dict";
import type StoreSchema from "pema/StoreSchema";

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
