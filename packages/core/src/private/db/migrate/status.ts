import store from "#db/migrate/store";
import c from "@rcompat/cli/color";
import print from "@rcompat/cli/print";
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
    print(`${c.green("Applied")} ${file?.name ?? "unknown"} (${date.toISOString()})\n`);
  }

  if (last_applied.length > 0 && pending.length > 0) {
    print("---\n");
  }

  for (const { name, n } of pending) {
    print(`${c.yellow("Pending")} ${c.bold(name)}\n`);
  }

  if (last_applied.length === 0 && pending.length === 0) {
    print("No migrations found.\n");
  }
}
