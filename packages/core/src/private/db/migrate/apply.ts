import E from "#db/errors";
import store from "#db/migrate/store";
import color from "@rcompat/cli/color";
import print from "@rcompat/cli/print";
import fs from "@rcompat/fs";

export default async function apply_migration() {
  const Migration = await store();
  await Migration.table.create();
  const last = await Migration.find({ limit: 1, sort: { id: "desc" } });
  const last_id = last.length === 0 ? 0 : last[0].id;

  const root = await fs.project.root();
  const migrations_dir = root.join("migrations");
  if (!await migrations_dir.exists()) throw E.migration_directory_missing();

  const files = (await migrations_dir.files({ filter: /\d+-.*\.[jt]s$/ }))
    .map(f => ({ file: f, n: parseInt(f.name.split("-")[0]) }))
    .filter(({ n }) => n > last_id)
    .toSorted((a, b) => a.n - b.n);

  if (files.length === 0) {
    print("No pending migrations.\n");
    return;
  }

  for (const { file, n } of files) {
    const { default: migration } = await import(file.path);
    await migration(Migration.db);
    await Migration.insert({ id: n, applied: new Date() });
    print(`Applied migration ${color.bold(file.name)}.\n`);
  }

  const plural = files.length === 1 ? "" : "s";
  print(`Done. Applied ${files.length} migration${plural}.\n`);
  process.exit();
}
