import type As from "#db/As";
import type DataDict from "#db/DataDict";
import type Sort from "#db/Sort";
import type Types from "#db/Types";
import type With from "#db/With";
import E from "#db/error";
import is from "@rcompat/is";
import type { Dict } from "@rcompat/type";

export interface ReadArgs {
  where: DataDict;
  fields?: string[];
  sort?: Sort;
  limit?: number;
}

export interface ReadRelationsArgs extends ReadArgs {
  with: With;
}

function normalize_sort(key: string, direction: "asc" | "desc") {
  if (!is.string(direction)) throw E.sort_invalid();
  const l = direction.toLowerCase();
  if (l !== "asc" && l !== "desc") throw E.sort_invalid_value(key, direction);
  return l.toUpperCase();
}

function assert_columns(types: Types, columns: string[]) {
  const known = new Set(Object.keys(types));
  const unknown = columns.filter(c => !known.has(c));
  if (unknown.length > 0) throw E.fields_unknown(unknown);
}

function quote(name: string) {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) throw E.identifier_invalid(name);
  return `\`${name}\``;
}

const OPS: Dict<">" | ">=" | "<" | "<="> = {
  $gt: ">",
  $gte: ">=",
  $lt: "<",
  $lte: "<=",
  $after: ">",
  $before: "<",
};

const sql = {
  quote,

  table(as: As) {
    return quote(as.name);
  },

  selectList(types: Types, columns?: string[]) {
    if (columns === undefined) return "*";
    if (columns.length === 0) throw E.field_required("select");
    assert_columns(types, columns);
    return columns.map(quote).join(", ");
  },

  orderBy(types: Types, sort?: Sort, alias?: string) {
    if (sort === undefined) return "";
    const columns = Object.entries(sort);
    if (columns.length === 0) throw E.field_required("sort");
    assert_columns(types, columns.map(([k]) => k));

    const order = columns
      .map(([k, direction]) => {
        const quoted = quote(k);
        const col = alias ? `${alias}.${quoted}` : quoted;
        return `${col} ${normalize_sort(k, direction)}`;
      })
      .join(", ");
    return ` ORDER BY ${order}`;
  },

  limit(limit?: number) {
    return limit !== undefined ? ` LIMIT ${limit}` : "";
  },

  aliases(tables: string[]) {
    const counts: Dict<number> = {};
    const result: Dict<string> = {};

    for (const table of tables) {
      const prefix = table[0].toLowerCase();
      counts[prefix] ??= 0;
      result[table] = `${prefix}${counts[prefix]++}`;
    }

    return result;
  },

  select(aliases: Dict<string>, as: As, fields?: string[]) {
    const alias = aliases[as.name];
    return (fields ?? Object.keys(as.types))
      .map(f => `${alias}.${quote(f)} AS ${alias}_${f}`)
      .join(", ");
  },

  bindKey(column: string, op: string) {
    const suffix = op.startsWith("$") ? op.slice(1) : op;
    return `${column}__${suffix}`;
  },

  project(row: Dict, fields?: string[]) {
    if (fields === undefined || fields.length === 0) return { ...row };
    const out: Dict = {};
    for (const k of fields) if (k in row) out[k] = row[k];
    return out;
  },

  hasWith(args: ReadArgs & { with?: With }): args is ReadRelationsArgs {
    return args.with !== undefined;
  },
  OPS,
};

export default sql;
