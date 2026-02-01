import typemap from "#typemap";
import type {
  As, AsPK, DataDict, DB, PK, Sort, Types, With,
} from "@primate/core/db";
import E from "@primate/core/db/error";
import type { ReadArgs, ReadRelationsArgs } from "@primate/core/db/sql";
import sql from "@primate/core/db/sql";
import assert from "@rcompat/assert";
import is from "@rcompat/is";
import type { PrimitiveParam } from "@rcompat/sqlite";
import Client from "@rcompat/sqlite";
import type { Dict } from "@rcompat/type";
import type { DataKey, StoreSchema } from "pema";
import p from "pema";

type Binds = Dict<PrimitiveParam>;

type CMP_OPERATOR = ">" | ">=" | "<" | "<=";

const BIND_BY = "$";
const UNSIGNED_BIGINT_TYPES = ["u64", "u128"];
const SIGNED_BIGINT_TYPES = ["i128"];
const BIGINT_STRING_TYPES = [...UNSIGNED_BIGINT_TYPES, ...SIGNED_BIGINT_TYPES];

const schema = p({
  database: p.string.default(":memory:"),
});

function like_to_glob(pattern: string) {
  let out = "";
  for (const char of pattern) {
    switch (char) {
      case "%": out += "*"; break;
      case "_": out += "?"; break;
      case "*": out += "[*]"; break;
      case "?": out += "[?]"; break;
      case "[": out += "[[]"; break;
      case "]": out += "[]]"; break;
      default: out += char;
    }
  }
  return out;
}

function u_cmp(field: string, a: string, b: string, op: CMP_OPERATOR) {
  const la = `LENGTH(${a})`;
  const lb = `LENGTH(${b})`;

  switch (op) {
    case ">":
      return `${la}>${lb} OR (${la}=${lb} AND ${a}>${b})`;
    case ">=":
      return `${a}=${b} OR ${la}>${lb} OR (${la}=${lb} AND ${a}>${b})`;
    case "<":
      return `${la}<${lb} OR (${la}=${lb} AND ${a}<${b})`;
    case "<=":
      return `${a}=${b} OR ${la}<${lb} OR (${la}=${lb} AND ${a}<${b})`;
    default:
      throw E.operator_unknown(field, op);
  }
}

function i_cmp(field: string, bind: string, op: ">" | ">=" | "<" | "<=") {
  const a = `CAST(${field} AS TEXT)`;
  const b = `CAST(${bind} AS TEXT)`;
  const a_neg = `(${a} LIKE '-%')`;
  const b_neg = `(${b} LIKE '-%')`;
  const a_abs = `CASE WHEN ${a_neg} THEN SUBSTR(${a}, 2) ELSE ${a} END`;
  const b_abs = `CASE WHEN ${b_neg} THEN SUBSTR(${b}, 2) ELSE ${b} END`;

  const is_gt = op === ">" || op === ">=";
  const strict = op === ">" || op === "<";

  const pos_neg_case = is_gt
    ? `(${a_neg} = 0 AND ${b_neg} = 1)`
    : `(${a_neg} = 1 AND ${b_neg} = 0)`;

  const abs_op_positive = strict ? op : (is_gt ? ">" : "<");
  const abs_op_negative = is_gt ? (strict ? "<" : "<=") : (strict ? ">" : ">=");

  const same_sign = `(${a_neg} = ${b_neg} AND (` +
    `(${a_neg} = 0 AND (${u_cmp(field, a, b, abs_op_positive)})) OR ` +
    `(${a_neg} = 1 AND (${u_cmp(field, a_abs, b_abs, abs_op_negative)}))` +
    "))";

  const core = `${pos_neg_case} OR ${same_sign}`;
  return strict ? `(${core})` : `(${a} = ${b} OR (${core}))`;
}

function cmp_expr(field: string, key: string, op: string, datatype: string) {
  const rhs = `${BIND_BY}${key}`;
  const sql_op = sql.OPS[op];
  assert.defined(sql_op, E.operator_unknown(field, op));

  if (BIGINT_STRING_TYPES.includes(datatype)) {
    const cmp = UNSIGNED_BIGINT_TYPES.includes(datatype)
      ? u_cmp(field, `CAST(${field} AS TEXT)`, `CAST(${rhs} AS TEXT)`, sql_op)
      : i_cmp(field, rhs, sql_op);
    return `(${cmp})`;
  }

  return `${field} ${sql_op} ${rhs}`;
}

function like(field: string, key: string, case_insensitive: boolean) {
  const rhs = `${BIND_BY}${key}`;

  if (case_insensitive) return `LOWER(${field}) LIKE LOWER(${rhs})`;

  return `CAST(${field} AS TEXT) GLOB ${rhs}`;
}

function get_column(key: DataKey) {
  return typemap[key].column;
}

function use_join(relations: With): boolean {
  const rels = Object.values(relations);
  if (rels.length !== 1) return false;

  const r = rels[0];
  return (
    !r.reverse &&
    r.kind === "many" &&
    r.limit === undefined &&
    r.sort === undefined &&
    Object.keys(r.where).length === 0
  );
}

function bind_value(key: DataKey, value: unknown) {
  return value === null ? null : typemap[key].bind(value as never);
}

function unbind_value(key: DataKey, value: unknown) {
  return typemap[key].unbind(value as never);
}

async function bind(types: Types, object: DataDict): Promise<Binds> {
  const out: Binds = {};

  for (const [key, value] of Object.entries(object)) {
    if (is.dict(value)) throw E.operator_scalar(key);

    const raw = key.startsWith("s_") ? key.slice(2) : key;
    const base = raw.split("__")[0];

    out[`${BIND_BY}${key}`] = await bind_value(types[base], value);
  }

  return out;
}

function unbind(types: Types, object: Dict): Dict {
  const out: Dict = {};

  for (const [key, value] of Object.entries(object)) {
    if (value !== null) {
      out[key] = unbind_value(types[key], value);
    }
  }

  return out;
}

export default class SQLite implements DB {
  #factory: () => Client;
  #client?: Client;
  #debug = false;
  #explain: Dict<{ query: string; plans: string[] }> = {};

  static config: typeof schema.input;

  constructor(config?: typeof schema.input, options?: { debug?: boolean }) {
    const parsed = schema.parse(config);
    this.#factory = () => new Client(parsed.database, { safeIntegers: true });
    this.#debug = options?.debug ?? false;
  }

  get #db() {
    return this.#client ??= this.#factory();
  }

  #sql(query: string) {
    return this.#db.prepare(query);
  }

  #query_one<T>(as: As, query: string, binds: Binds) {
    this.#capture(as.name, query, binds);
    const [row] = this.#sql(query).all(binds) as [T];
    return row;
  }

  #query_all(as: As, query: string, binds: Binds) {
    this.#capture(as.name, query, binds);
    const rows = this.#sql(query).all(binds) as Dict[];
    return rows.map(r => unbind(as.types, r));
  }

  #query_run(query: string, binds: Binds) {
    return Number(this.#sql(query).run(binds).changes);
  }

  #capture(table: string, query: string, binds: Binds) {
    if (!this.#debug) return;

    type Details = { detail: string }[];

    const rows = this.#sql(`EXPLAIN QUERY PLAN ${query}`).all(binds) as Details;
    this.#explain[table] = { query, plans: rows.map(r => r.detail) };
  }

  get explain() {
    return this.#explain;
  }

  get schema() {
    return {
      create: (name: string, store: StoreSchema, pk: PK) => {
        const columns: string[] = [];

        for (const [key, value] of Object.entries(store)) {
          const column = `${sql.quote(key)} ${get_column(value.datatype)}`;
          columns.push(key === pk ? `${column} PRIMARY KEY` : column);
        }

        this.#sql(`CREATE TABLE IF NOT EXISTS
          ${sql.quote(name)} (${columns.join(", ")})`).run();
      },
      delete: (name: string) => {
        this.#sql(`DROP TABLE IF EXISTS ${sql.quote(name)}`).run();
      },
    };
  }

  close() {
    this.#db.close();
  }

  #where(types: Types, where: DataDict, alias?: string) {
    const fields = Object.keys(where);
    if (fields.length === 0) return "";

    const parts: string[] = [];

    for (const field of fields) {
      const value = where[field];
      const datatype = types[field];
      const q = sql.quote(field);
      const quoted = alias ? `${alias}.${q}` : q;

      if (value === null) {
        parts.push(`${quoted} IS NULL`);
        continue;
      }

      if (is.dict(value)) {
        const ops = Object.entries(value);
        if (ops.length === 0) throw E.operator_empty(field);

        for (const [op] of ops) {
          const bound_key = sql.bindKey(field, op);

          switch (op) {
            case "$like":
              parts.push(like(quoted, bound_key, false));
              break;
            case "$ilike":
              parts.push(like(quoted, bound_key, true));
              break;
            case "$ne":
              parts.push(`${quoted} != ${BIND_BY}${bound_key}`);
              break;
            case "$gt":
            case "$gte":
            case "$lt":
            case "$lte":
            case "$after":
            case "$before":
              parts.push(cmp_expr(quoted, bound_key, op, datatype));
              break;
            default:
              throw E.operator_unknown(field, op);
          }
        }
        continue;
      }

      parts.push(`${quoted} = ${BIND_BY}${field}`);
    }

    return `WHERE ${parts.join(" AND ")}`;
  }

  async #bind_where(types: Types, where: DataDict): Promise<Binds> {
    const filtered: DataDict = {};

    for (const [field, value] of Object.entries(where)) {
      if (value === null) continue;

      if (is.dict(value)) {
        const ops = Object.entries(value);

        for (const [op, op_value] of ops) {
          const bound_key = sql.bindKey(field, op);

          switch (op) {
            case "$like":
              filtered[bound_key] = like_to_glob(op_value as string);
              break;
            case "$ilike":
            case "$gte":
            case "$gt":
            case "$after":
            case "$lte":
            case "$lt":
            case "$before":
            case "$ne":
              filtered[bound_key] = op_value;
              break;
            default:
              throw E.operator_unknown(field, op);
          }
        }
        continue;
      }

      filtered[field] = value;
    }

    return bind(types, filtered);
  }

  #set(set: DataDict) {
    const columns = Object.keys(set);

    if (columns.length === 0) throw E.field_required("set");

    return `SET ${columns.map(c =>
      `${sql.quote(c)}=${BIND_BY}s_${c}`).join(", ")}`;
  }

  async #bind_set(types: Types, set: DataDict) {
    const columns = Object.keys(set);

    if (columns.length === 0) throw E.field_required("set");
    const raw = Object.fromEntries(columns.map(c => [`s_${c}`, set[c]]));
    const binds = await bind(types, raw);

    return binds;
  }

  async create<O extends Dict>(as: As, record: Dict): Promise<O> {
    assert.dict(record);

    const data = record as DataDict;
    const keys = Object.keys(data);

    const query = keys.length > 0
      ? `INSERT INTO ${sql.table(as)} (
          ${keys.map(k => sql.quote(k)).join(", ")})
          VALUES (${keys.map(k => `${BIND_BY}${k}`).join(", ")})`
      : `INSERT INTO ${sql.table(as)} DEFAULT VALUES`;

    this.#sql(query).run(await bind(as.types, data));

    return record as O;
  }

  read(as: As, args: {
    count: true;
    where: DataDict;
    with?: never;
  }): Promise<number>;
  read(as: As, args: {
    where: DataDict;
    fields?: string[];
    limit?: number;
    sort?: Sort;
    with?: With;
  }): Promise<Dict[]>;
  async read(as: As, args: {
    count?: true;
    where: DataDict;
    fields?: string[];
    limit?: number;
    sort?: Sort;
    with?: With;
  }) {
    assert.dict(args.where);

    this.#explain = {};

    if (args.count === true) return this.#count(as, args.where);

    if (sql.hasWith(args)) {
      return use_join(args.with)
        ? this.#read_joined(as, args)
        : this.#read_phased(as, args);
    }

    return this.#read_base(as, args);
  }

  async #count(as: As, where: DataDict) {
    const WHERE = this.#where(as.types, where);
    const binds = await this.#bind_where(as.types, where);
    const query = `SELECT COUNT(*) AS n FROM ${sql.table(as)} ${WHERE}`;

    return Number(this.#query_one<{ n: bigint }>(as, query, binds).n);
  }

  async #read_base(as: As, args: ReadArgs): Promise<Dict[]> {
    const SELECT = sql.selectList(as.types, args.fields);
    const WHERE = this.#where(as.types, args.where);
    const ORDER_BY = sql.orderBy(as.types, args.sort);
    const LIMIT = sql.limit(args.limit);
    const table = sql.table(as);
    const query = `SELECT ${SELECT} FROM ${table} ${WHERE}${ORDER_BY}${LIMIT}`;
    const binds = await this.#bind_where(as.types, args.where);

    return this.#query_all(as, query, binds);
  }

  async #read_phased(as: As, args: ReadRelationsArgs) {
    const fields = this.#expand_fields(as, args.fields, args.with);
    const base_rows = await this.#read_base(as, { ...args, fields });
    const out: Dict[] = base_rows.map(row => sql.project(row, args.fields));

    for (const [name, relation] of Object.entries(args.with)) {
      await this.#attach_relation(as, base_rows, out, name, relation);
    }

    return out;
  }

  #expand_fields(as: As, fields: string[] | undefined, relations: With) {
    if (fields === undefined) return undefined;

    const expanded = new Set(fields);
    if (as.pk !== null) expanded.add(as.pk);
    for (const r of Object.values(relations)) if (r.reverse) expanded.add(r.fk);

    return [...expanded];
  }

  async #attach_relation(
    as: As,
    base_rows: Dict[],
    out: Dict[],
    name: string,
    relation: NonNullable<With[string]>,
  ) {
    const by = relation.reverse ? relation.as.pk : relation.fk;
    if (by === null) throw E.relation_requires_pk("target");

    const parent_by = relation.reverse ? relation.fk : as.pk;
    if (parent_by === null) throw E.relation_requires_pk("parent");

    const join_values = [...new Set(
      base_rows.map(r => r[parent_by]).filter(v => v != null),
    )];
    const is_many = relation.kind === "many";
    const many = is_many ? [] : null;

    if (join_values.length === 0) {
      for (const row of out) row[name] = many;
      return;
    }

    const related = await this.#load_related({ by, join_values, ...relation });

    const grouped = new Map<unknown, Dict[]>();
    for (const row of related) {
      const key = row[by];
      if (key == null) continue;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(row);
    }

    for (let i = 0; i < out.length; i++) {
      const join_value = base_rows[i][parent_by];

      if (join_value == null) {
        out[i][name] = many;
        continue;
      }

      const rows = grouped.get(join_value) ?? [];
      out[i][name] = is_many
        ? rows.map(r => sql.project(r, relation.fields))
        : (rows[0] ? sql.project(rows[0], relation.fields) : null);
    }
  }

  async #load_related(args: {
    as: As;
    by: string;
    join_values: unknown[];
    where: DataDict;
    fields?: string[];
    sort?: Sort;
    kind?: "one" | "many";
    limit?: number;
  }) {
    const per_parent = args.kind === "one" ? 1 : args.limit;
    const in_binds: DataDict = {};
    const placeholders: string[] = [];
    args.join_values.forEach((v, i) => {
      const key = `${args.by}__in${i}`;
      in_binds[key] = v as DataDict[string];
      placeholders.push(`${BIND_BY}${key}`);
    });
    const where = this.#where(args.as.types, args.where);
    const where_part = where ? where.slice("WHERE ".length) : "";
    const in_part = `${sql.quote(args.by)} IN (${placeholders.join(", ")})`;

    const where_parts = where_part
      ? [`(${where_part})`, `(${in_part})`]
      : [in_part];
    const WHERE = `WHERE ${where_parts.join(" AND ")}`;

    const all_columns = Object.keys(args.as.types);
    const base_fields = args.fields !== undefined && args.fields.length > 0
      ? args.fields
      : all_columns;
    const select_fields = [...new Set([...base_fields, args.by])];
    const SELECT = sql.selectList(args.as.types, select_fields);

    const base_order = `${sql.quote(args.by)} ASC`;
    const user_order = sql.orderBy(args.as.types, args.sort)
      .replace(/^ ORDER BY /, "");
    const ORDER_BY = user_order
      ? ` ORDER BY ${base_order}, ${user_order}`
      : ` ORDER BY ${base_order}`;

    const crit_binds = await this.#bind_where(args.as.types, args.where);
    const in_binds_bound = await bind(args.as.types, in_binds);

    let query: string;
    let binds: Binds;

    if (per_parent !== undefined) {
      const per_key = `${args.by}__limit__per_parent`;

      query = `
        WITH ranked AS (
          SELECT
            ${SELECT},
            ROW_NUMBER() OVER (
              PARTITION BY ${sql.quote(args.by)}
              ${user_order ? `ORDER BY ${user_order}` : ""}
            ) AS __rn
          FROM ${sql.table(args.as)}
          ${WHERE}
        )
        SELECT ${SELECT}
        FROM ranked
        WHERE __rn <= ${BIND_BY}${per_key}
        ${ORDER_BY}
      `;

      binds = {
        ...crit_binds, ...in_binds_bound,
        [`${BIND_BY}${per_key}`]: per_parent,
      };
    } else {
      query = `SELECT ${SELECT} FROM ${sql.table(args.as)} ${WHERE}${ORDER_BY}`;
      binds = { ...crit_binds, ...in_binds_bound };
    }

    return this.#query_all(args.as, query, binds);
  }

  #join(aliases: Dict<string>, parent_as: As, rel: NonNullable<With[string]>) {
    const parent_alias = aliases[parent_as.name];
    const rel_alias = aliases[rel.as.name];
    const table = sql.table(rel.as);

    const join_col = rel.reverse ? rel.as.pk : rel.fk;
    const parent_col = rel.reverse ? rel.fk : parent_as.pk;

    if (join_col === null) throw E.relation_requires_pk("target");
    if (parent_col === null) throw E.relation_requires_pk("parent");

    const lhs = `${rel_alias}.${sql.quote(join_col)}`;
    const rhs = `${parent_alias}.${sql.quote(parent_col)}`;

    return `LEFT JOIN ${table} ${rel_alias} ON ${lhs} = ${rhs}`;
  }

  #nest(
    rows: Dict[],
    aliases: Dict<string>,
    as: As,
    fields: string[] | undefined,
    relations: With,
  ): Dict[] {
    if (as.pk === null) throw E.relation_requires_pk("parent");

    const alias = aliases[as.name];
    const pk_key = `${alias}_${as.pk}`;
    const base_fields = fields ?? Object.keys(as.types);
    const grouped = new Map<unknown, Dict>();

    for (const row of rows) {
      const pk_val = row[pk_key];

      if (!grouped.has(pk_val)) {
        const parent: Dict = {};
        for (const f of base_fields) {
          parent[f] = row[`${alias}_${f}`];
        }
        for (const [name, rel] of Object.entries(relations)) {
          parent[name] = rel.kind === "many" ? [] : null;
        }
        grouped.set(pk_val, parent);
      }

      const parent = grouped.get(pk_val)!;

      for (const [name, rel] of Object.entries(relations)) {
        const rel_alias = aliases[rel.as.name];
        const rel_pk = rel.as.pk;
        if (rel_pk === null) continue;

        const rel_pk_key = `${rel_alias}_${rel_pk}`;
        if (row[rel_pk_key] == null) continue;

        const rel_fields = rel.fields ?? Object.keys(rel.as.types);
        const rel_row: Dict = {};
        for (const f of rel_fields) {
          rel_row[f] = row[`${rel_alias}_${f}`];
        }

        if (rel.kind === "many") {
          (parent[name] as Dict[]).push(rel_row);
        } else if (parent[name] === null) {
          parent[name] = rel_row;
        }
      }
    }

    return [...grouped.values()];
  }

  async #read_joined(as: As, args: ReadRelationsArgs): Promise<Dict[]> {
    const { where, fields, sort, with: _with } = args;

    if (as.pk === null) throw E.relation_requires_pk("parent");

    const tables = [as.name, ...Object.values(_with).map(r => r.as.name)];
    const aliases = sql.aliases(tables);
    const alias = aliases[as.name];

    const base_fields = fields ? [...new Set([...fields, as.pk])] : undefined;

    const SELECT = [
      sql.select(aliases, as, base_fields),
      ...Object.values(_with).map(r => {
        const rel_fields = r.fields && r.as.pk
          ? [...new Set([...r.fields, r.as.pk])]
          : r.fields;
        return sql.select(aliases, r.as, rel_fields);
      }),
    ].join(", ");
    const FROM = `${sql.table(as)} ${alias}`;
    const JOINS = Object.values(_with)
      .map(rel => this.#join(aliases, as, rel))
      .join("\n");
    const WHERE = this.#where(as.types, where, alias);
    const ORDER_BY = sql.orderBy(as.types, sort, alias);

    const binds = await this.#bind_where(as.types, where);
    const query = `SELECT ${SELECT} FROM ${FROM} ${JOINS} ${WHERE} ${ORDER_BY}`;
    const rows = this.#sql(query).all(binds) as Dict[];

    this.#capture(as.name, query, binds);

    return this.#nest(rows, aliases, as, fields, _with);
  }

  async update(as: As, args: { set: DataDict; where: DataDict }) {
    assert.nonempty(args.set);
    assert.dict(args.where);

    const WHERE = this.#where(as.types, args.where);
    const where_binds = await this.#bind_where(as.types, args.where);
    const SET = this.#set(args.set);
    const set_binds = await this.#bind_set(as.types, args.set);
    const query = `UPDATE ${sql.table(as)} ${SET} ${WHERE}`;

    return this.#query_run(query, { ...where_binds, ...set_binds });
  }

  async delete(as: As, args: { where: DataDict }) {
    assert.nonempty(args.where);

    const WHERE = this.#where(as.types, args.where);
    const query = `DELETE FROM ${sql.table(as)} ${WHERE}`;
    const binds = await this.#bind_where(as.types, args.where);

    return this.#query_run(query, binds);
  }

  async lastId(as: AsPK) {
    assert.defined(as.types[as.pk]);

    const datatype = as.types[as.pk];

    if (datatype === "string") return 0;

    const pk = sql.quote(as.pk);
    const table = sql.quote(as.name);
    const base = `SELECT ${pk} AS v FROM ${table}`;

    if (UNSIGNED_BIGINT_TYPES.includes(datatype)) {
      const query = `${base} ORDER BY LENGTH(${pk}) DESC, ${pk} DESC LIMIT 1`;
      const rows = this.#sql(query).all() as { v: string | null }[];
      return rows[0]?.v ? BigInt(rows[0].v) : 0n;
    }

    const query = `${base} ORDER BY ${pk} DESC LIMIT 1`;
    const rows = this.#sql(query).all();
    return rows[0]?.v != null ? Number(rows[0].v) : 0;
  }
}
