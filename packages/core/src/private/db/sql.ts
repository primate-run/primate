import type As from "#db/As";
import type DataDict from "#db/DataDict";
import type Sort from "#db/Sort";
import type Types from "#db/Types";
import type With from "#db/With";
import E from "#db/error";
import assert from "@rcompat/assert";
import is from "@rcompat/is";
import type { Dict } from "@rcompat/type";
import type { DataKey } from "pema";

export interface ReadArgs {
  where: DataDict;
  fields?: string[];
  sort?: Sort;
  limit?: number;
}

export interface ReadRelationsArgs extends ReadArgs {
  with: With;
}

const UNSIGNED_BIGINT_TYPES = ["u64", "u128"];
const SIGNED_BIGINT_TYPES = ["i128"];
const BIGINT_STRING_TYPES = [...UNSIGNED_BIGINT_TYPES, ...SIGNED_BIGINT_TYPES];
const INT_TYPES = ["u8", "u16", "u32", "i8", "i16", "i32"];

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

function Q(strings: TemplateStringsArray, ...values: (string | unknown[])[]) {
  return strings.reduce((result, string, i) => {
    if (i === values.length) return result + string;

    const value = values[i];
    let processed: string;

    if (Array.isArray(value)) {
      processed = value.join(", ");
    } else if (typeof value === "string") {

      processed = sql.quote(value);
    } else {
      throw "Q: use only strings or arrays";
    }

    return result + string + processed;
  }, "");
};

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
    const alias = aliases[as.table];
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

  withed(args: ReadArgs & { with?: With }): args is ReadRelationsArgs {
    return args.with !== undefined;
  },

  joinable(parent: As, relations: With): boolean {
    const rels = Object.values(relations);
    if (rels.length !== 1) return false;

    const r = rels[0];
    if (parent.pk === null) return false;

    return (
      !r.reverse &&
      r.kind === "many" &&
      r.limit === undefined &&
      r.sort === undefined &&
      Object.keys(r.where).length === 0 &&
      r.as.pk !== null
    );
  },

  unbind<R>(
    types: Types,
    row: Dict,
    unbinder: (key: DataKey, value: unknown) => R,
  ) {
    const out: Dict<R> = {};

    for (const [key, value] of Object.entries(row)) {
      if (value === null) continue;

      assert.true(key in types, `unexpected column: ${key}`);

      out[key] = unbinder(types[key], value);
    }

    return out;
  },

  fields(base: string[] | undefined, ...add: (string | null)[]) {
    if (base === undefined) return undefined;
    const set = new Set(base);
    for (const f of add) if (f !== null) set.add(f);
    return [...set];
  },

  expandFields(as: As, fields: string[] | undefined, relations: With) {
    const fks = Object.values(relations).flatMap(r => r.reverse ? [r.fk] : []);
    return sql.fields(fields, as.pk, ...fks);
  },

  nest<T>(
    as: As,
    args: { rows: Dict[]; aliases: Dict<string> },
    relation_args: ReadRelationsArgs,
    unbind: (type: DataKey, value: unknown) => T,
  ): Dict[] {
    if (as.pk === null) throw E.relation_requires_pk("parent");

    const base_alias = args.aliases[as.table];
    const base_pk_key = `${base_alias}_${as.pk}`;
    const base_fields = relation_args.fields ?? Object.keys(as.types);
    const grouped = new Map<unknown, Dict>();

    for (const base_row of args.rows) {
      const pk_value = base_row[base_pk_key];
      const relation_entries = Object.entries(relation_args.with);

      if (!grouped.has(pk_value)) {
        const parent: Dict = {};
        for (const f of base_fields) {
          const v = base_row[`${base_alias}_${f}`];
          if (v == null) continue;
          parent[f] = unbind(as.types[f], v);
        }
        for (const [name, relation] of relation_entries) {
          parent[name] = relation.kind === "many" ? [] : null;
        }
        grouped.set(pk_value, parent);
      }

      const parent = grouped.get(pk_value)!;

      for (const [name, relation] of relation_entries) {
        const alias = args.aliases[relation.as.table];
        const pk = relation.as.pk;
        if (pk === null) continue;

        const pk_key = `${alias}_${pk}`;
        if (base_row[pk_key] == null) continue;

        const fields = relation.fields ?? Object.keys(relation.as.types);
        const row: Dict = {};
        for (const field of fields) {
          const v = base_row[`${alias}_${field}`];
          if (v == null) continue;
          row[field] = unbind(relation.as.types[field], v);
        }

        if (relation.kind === "many") {
          (parent[name] as Dict[]).push(row);
        } else if (parent[name] === null) {
          parent[name] = row;
        }
      }
    }

    return [...grouped.values()];
  },

  Q,

  OPS,

  BIGINT_STRING_TYPES,
  UNSIGNED_BIGINT_TYPES,
  INT_TYPES,
};

export default sql;
