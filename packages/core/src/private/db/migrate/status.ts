import store from "#db/migrate/store";
import cli from "@rcompat/cli";
import runtime from "@rcompat/runtime";

export default async function status_migration() {
  const root = await runtime.projectRoot();
  const migrations_dir = root.join("migrations");

  const Migration = await store();
  await Migration.table.create();

  const applied = await Migration.find({
    limit: 3,
    sort: { id: "desc" },
  });

  const files = await (async () => {
    if (!await migrations_dir.exists()) return [];
    return (await migrations_dir.files({ filter: /\d+-.*\.[jt]s$/ }))
      .map(f => ({ name: f.name, n: parseInt(f.name.split("-")[0]) }))
      .toSorted((a, b) => a.n - b.n);
  })();

  const last_id = applied.length === 0 ? 0 : applied[0].id;
  const pending = files.filter(f => f.n > last_id);
  const last_applied = applied.toReversed();

  for (const { id, applied: date } of last_applied) {
    const file = files.find(f => f.n === id);
    cli.print(`${cli.fg.green("Applied")} ${file?.name ?? "unknown"} (${date.toISOString()})\n`);
  }

  if (last_applied.length > 0 && pending.length > 0) {
    cli.print("---\n");
  }

  for (const { name } of pending) {
    cli.print(`${cli.fg.yellow("Pending")} ${cli.fg.bold(name)}\n`);
  }

  if (last_applied.length === 0 && pending.length === 0) {
    cli.print("No migrations found.\n");
  }
}
