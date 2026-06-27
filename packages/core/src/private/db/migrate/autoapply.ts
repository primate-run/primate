import type AppFacade from "#app/Facade";
import type DB from "#db/DB";
import E from "#errors";
import store from "#store";
import key from "#store/key";
import cli from "@rcompat/cli";
import p from "pema";

type Migration = (db: DB) => unknown | Promise<unknown>;
type MigrationEntry = [number, string, Migration];

export default async function autoapply(
  facade: AppFacade,
  migrations: MigrationEntry[],
) {
  const migrations_config = facade.config("db.migrations");
  if (migrations_config == undefined) throw E.config_missing("db.migrations");

  const { table, db } = migrations_config;
  const Migration = store({
    table,
    db,
    schema: {
      id: key.primary(p.u16, { generate: false }),
      applied: p.date,
    },
  });

  await Migration.create();
  const last = await Migration.find({ limit: 1, sort: { id: "desc" } });
  const last_id = last.length === 0 ? 0 : last[0].id;
  const pending = migrations.filter(([id]) => id > last_id);

  if (pending.length === 0) {
    cli.print("No pending migrations.\n");
    return;
  }

  for (const [id, name, migration] of pending) {
    await migration(Migration.db);
    await Migration.insert({ id, applied: new Date() });
    cli.print(`Applied migration ${cli.fg.bold(name)}.\n`);
  }

  const plural = pending.length === 1 ? "" : "s";
  cli.print(`Done. Applied ${pending.length} migration${plural}.\n`);
}
