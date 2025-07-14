//import invalid_type from "#db/error/invalid-type";
//import no_primary_key from "#db/error/no-primary-key";
//import no_store_directory from "#db/error/no-store-directory";
import primary from "#db/primary";
import location from "#location";
import type BuildHook from "#module/BuildHook";
import FileRef from "@rcompat/fs/FileRef";
import empty from "@rcompat/record/empty";
import entries from "@rcompat/record/entries";
import type Dictionary from "@rcompat/type/Dictionary";

type Type = {
  base: string;
  validate(): void;
};

const valid_type = (type: Dictionary): type is Type =>
  type.base !== undefined && typeof type.validate === "function";

const valid = (type: Dictionary, name: string, store: string) => {
  if (valid_type(type)) {
    return true;
  }
  //invalid_type(name, store);
};

export default (directory: string): BuildHook => async (app, next) => {
  const root = app.root.join(directory);
  if (!await root.exists()) {
    //no_store_directory(root);
    return next(app);
  }

  await Promise.all((await root.collect()).map(async store => {
    const { name } = store;
    const definition = await store.import();

    const schema = entries(definition.default ?? {})
      .filter(([property, type]) => valid(type as Dictionary, property, name)!)
      .get();

    let { ambiguous } = definition;
    // consider a store ambiguous if no (or empty) default export
    if (empty(schema)) {
      ambiguous = true;
    }

    /*!ambiguous && schema.id === undefined
      && no_primary_key(primary, name, "export const ambiguous = true;");*/
  }));

  await app.stage(app.root.join(directory), FileRef.join(location.server, directory));

  app.server_build.push("stores");

  return next(app);
};
