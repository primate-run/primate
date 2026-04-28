import type { SchemaDiff } from "#db/DB";
import E from "#db/errors";
import bundle from "#db/migrate/bundle";
import toMigrationStore from "#db/migrate/store";
import type Types from "#db/Types";
import type { Store } from "#orm/store";
import cli from "@rcompat/cli";
import runtime from "@rcompat/runtime";
import string from "@rcompat/string";

type MigrationDiff =
  | { op: "create"; store: Store<any> }
  | { op: "alter"; store: Store<any>; diff: SchemaDiff }
  ;

function generate_migration(diffs: MigrationDiff[]): string {
  const lines: string[] = ["export default async db => {"];

  for (const entry of diffs) {
    if (entry.op === "create") {
      const { store } = entry;
      const types = Object.entries(store.types)
        .map(([k, v]) => `    ${k}: "${v}"`)
        .join(",\n");
      const options = `{ name: "${store.pk}", generate: true }`;
      lines.push(`  await db.schema.create("${store.name}", ${options}, {`);
      lines.push(`${types}`);
      lines.push("  });");
    } else {
      const { store, diff } = entry;
      lines.push(`  await db.schema.alter("${store.name}", {`);
      lines.push(`    add: { ${Object.entries(diff.add).map(([k, v]) => `${k}: "${v}"`).join(", ")} },`);
      lines.push(`    drop: [${diff.drop.map(f => `"${f}"`).join(", ")}],`);
      lines.push(`    rename: [${diff.rename.map(([f, t]) => `["${f}", "${t}"]`).join(", ")}],`);
      lines.push("  });");
    }
  }

  lines.push("};");
  return lines.join("\n");
}

export default async function create_migration(desc: string) {
  const root = await runtime.projectRoot();
  const migrations = root.join("migrations");

  // discover store files
  const stores_dir = root.join("stores");
  if (!await stores_dir.exists()) throw E.store_directory_missing();

  const store_files = await stores_dir.files({
    recursive: true,
    filter: /\.[jt]s$/,
  });

  if (store_files.length === 0) throw E.store_directory_empty();

  let next = 1;
  if (await migrations.exists()) {
    const Migration = await toMigrationStore();
    await Migration.table.create();
    const last = await Migration.find({ limit: 1, sort: { id: "desc" } });
    const last_id = last.length === 0 ? 0 : last[0].id;
    const files = await migrations.files({ filter: /\d+-.*\.ts$/ });
    const highest = files.length === 0 ? 0 : Math.max(
      ...files.map(f => parseInt(f.name.split("-")[0])),
    );
    if (highest > last_id) throw E.unapplied_migrations();
    next = highest + 1;
  }

  // generate virtual entry
  const entry = store_files.map((f, i) =>
    `import s${i} from "${f.path}";`,
  ).join("\n") + `\nexport default [
    ${store_files.map((_, i) => `s${i}`).join(",\n ")}\n];`;
  console.log("entry", entry);
  const stores: Store<any>[] = await bundle(entry);

  const diffs: MigrationDiff[] = [];

  const seen = new Set<symbol>();
  const migration_stores: Store<any>[] = [];
  const names = new Map<string, string[]>();

  for (let i = 0; i < store_files.length; i++) {
    const file = store_files[i];
    const store = stores[i];
    if (!store.migrate) continue;
    if (seen.has(store.id)) continue;
    seen.add(store.id);
    migration_stores.push(store);

    const existing = names.get(store.name) ?? [];
    names.set(store.name, [...existing, file.name]);
  }

  const conflicts = [...names].filter(([, files]) => files.length > 1);
  if (conflicts.length > 0) {
    const messages = conflicts
      .map(([name, files]) => `table "${name}" claimed by: ${files.join(", ")}`)
      .join("\n");
    throw E.migration_store_conflict(messages);
  }

  for (const store of migration_stores) {
    const current = await store.db.schema.introspect(store.name, store.pk);

    // table doesn't exist yet, create
    if (current === null) {
      diffs.push({
        op: "create",
        store,
      });
      continue;
    }

    const db_fields = new Set(Object.keys(current));
    const store_fields = new Set(Object.keys(store.types));

    const add: Types = Object.fromEntries(
      [...store_fields]
        .filter(f => !db_fields.has(f))
        .map(f => [f, store.types[f]]),
    );

    const drop = [...db_fields].filter(f => !store_fields.has(f));

    if (Object.keys(add).length === 0 && drop.length === 0) continue;

    diffs.push({
      store,
      op: "alter",
      diff: { add, drop, rename: [] },
    });
  }

  for (const diff_entry of diffs) {
    if (diff_entry.op !== "alter") continue;

    const { diff, store } = diff_entry;
    const current = await store.db.schema.introspect(store.name, store.pk);
    const confirmed_renames: [string, string][] = [];
    const confirmed_drops: string[] = [];

    for (const dropped of diff.drop) {
      const candidates = current![dropped] ?? [];
      const matching_added = Object.entries(diff.add)
        .filter(([, type]) => candidates.includes(type))
        .map(([name]) => name);

      if (matching_added.length === 0) {
        confirmed_drops.push(dropped);
        continue;
      }

      for (const added of matching_added) {
        const d = cli.fg.bold(dropped);
        const a = cli.fg.bold(added);
        const answer = await cli.prompt.text({
          message: `${d} was removed and ${a} was `
            + `added with a compatible type. Rename ${d} → ${a}? (y/N)`,
        });

        if (!cli.prompt.isCancel(answer) && answer.toLowerCase() === "y") {
          confirmed_renames.push([dropped, added]);
          delete diff.add[added];
        } else {
          confirmed_drops.push(dropped);
        }
      }
    }

    diff.rename = confirmed_renames;
    diff.drop = confirmed_drops;
  }

  if (diffs.length === 0) {
    cli.print("No schema changes detected.\n");
    return;
  }

  if (!await migrations.exists()) await migrations.create();

  const content = generate_migration(diffs);
  const filename = `${next}-${string.toSlug(desc)}.ts`;
  await migrations.join(filename).write(content);
  cli.print(`Created ${cli.fg.bold(`migrations/${filename}`)}.\n`);
  runtime.exit();
};
