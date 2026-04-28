import E from "#db/errors";
import store from "#db/migrate/store";
import cli from "@rcompat/cli";
import runtime from "@rcompat/runtime";

export default async function apply_migration() {
  const Migration = await store();
  await Migration.create();
  const last = await Migration.find({ limit: 1, sort: { id: "desc" } });
  const last_id = last.length === 0 ? 0 : last[0].id;

  const root = await runtime.projectRoot();
  const migrations_dir = root.join("migrations");
  if (!await migrations_dir.exists()) throw E.migration_directory_missing();

  const files = (await migrations_dir.files({ filter: /\d+-.*\.[jt]s$/ }))
    .map(f => ({ file: f, n: parseInt(f.name.split("-")[0]) }))
    .filter(({ n }) => n > last_id)
    .toSorted((a, b) => a.n - b.n);

  if (files.length === 0) {
    cli.print("No pending migrations.\n");
    return;
  }

  for (const { file, n } of files) {
    const { default: migration } = await import(file.path);
    await migration(Migration.db);
    await Migration.insert({ id: n, applied: new Date() });
    cli.print(`Applied migration ${cli.fg.bold(file.name)}.\n`);
  }

  const plural = files.length === 1 ? "" : "s";
  cli.print(`Done. Applied ${files.length} migration${plural}.\n`);
  runtime.exit();
}
