import { s_attach, s_config } from "#app/Facade";
import E from "#db/errors";
import log from "#log";
import key from "#orm/key";
import store from "#orm/store";
import ServeApp from "#serve/App";
import serve_hook from "#serve/hook";
import type ServeInit from "#serve/Init";
import p from "pema";

export default async (root: string, options: ServeInit) => {
  const facade = options.facade;

  const app = await new ServeApp(root, options).init() as ServeApp;

  facade[s_attach](app);

  const config = facade[s_config];
  const migrations = config.db.migrations;

  try {
    if (migrations !== undefined) {
      const { table, db } = migrations;
      const Migration = store({
        name: table,
        db,
        schema: {
          id: key.primary(p.u16, { generate: false }),
          applied: p.date,
        },
      });

      await Migration.table.create();
      const last = await Migration.find({ limit: 1, sort: { id: "desc" } });
      const last_id = last.length === 0 ? 0 : last[0].id;

      const build_json = app.root.join("build.json");
      const { migration_version } = await build_json.json() as {
        migration_version: number;
      };
      if (last_id < migration_version) throw E.unapplied_migrations();
    }
    return serve_hook(app);
  } catch (cause) {
    log.error(cause);
  }
};
