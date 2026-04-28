import type AppFacade from "#app/Facade";
import bundle from "#db/migrate/bundle";
import E from "#errors";
import key from "#orm/key";
import store from "#orm/store";
import runtime from "@rcompat/runtime";
import p from "pema";

export default async function migration_store() {
  const root = await runtime.projectRoot();
  const { path } = await (async () => {
    const ts = root.join("config", "app.ts");
    if (await ts.exists()) return ts;
    const js = root.join("config", "app.js");
    if (await js.exists()) return js;
    throw E.config_file_missing();
  })();
  const entry = `export { default } from "${path}";`;
  const app: AppFacade = await bundle(entry);

  const migrations_config = app.config("db.migrations");
  if (migrations_config == undefined) throw E.config_missing("db.migrations");

  const { table, db } = migrations_config;

  return store({
    table,
    db,
    schema: {
      id: key.primary(p.u16, { generate: false }),
      applied: p.date,
    },
  });
}
