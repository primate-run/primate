import empty_store_directory from "#db/error/empty-store-directory";
import module from "#db/name";
import s_db from "#db/symbol";
import type { ServeAppHook } from "#module-loader";
import log from "@primate/core/log";
import empty from "@rcompat/array/empty";
import dim from "@rcompat/cli/color/dim";
import exclude from "@rcompat/record/exclude";

const directory = "stores";

type Driver = () => Promise<{

}>;

export default (driver: Driver): ServeAppHook => async (app, next) => {
  const root = app.runpath(directory);

  const defaults = {
    readonly: false,
    ambiguous: false,
  };

  const loaded: string[] = [];

  const stores = app.files.stores!.map(([name, definition]) => {
    const schema = definition.default ?? {};
    const pathed = name.replaceAll("/", ".");

    loaded.push(pathed);

    return [pathed, {
      ...exclude(definition, ["default"]),
      schema,
      name: definition.name ?? name.replaceAll("/", "_"),
      defaults,
    }];
  });

  log.info(`loaded ${loaded.map(l => dim(l)).join(" ")}`, { module });

  if (empty(stores)) {
    empty_store_directory(root);
    return next(app);
  }

  app.set(s_db, {
    driver: await driver(),
  });
  /*env.root = root;
  env.stores = stores;
  env.defaults = {
    driver: default_driver,
    ...defaults,
  };
  env.drivers = [...new Set(stores.map(({ driver }) =>
    driver ?? default_driver))];
  env.active = true;*/

  return next(app);
};
