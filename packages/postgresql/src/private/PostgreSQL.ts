import typemap from "#typemap";
import type {
  As, DataDict, DB, PK, ReadArgs, ReadRelationsArgs, Sort, Types, With,
} from "@primate/core/db";
import common from "@primate/core/db";
import E from "@primate/core/db/error";
import sql from "@primate/core/db/sql";
import assert from "@rcompat/assert";
import is from "@rcompat/is";
import type { Dict } from "@rcompat/type";
import type { DataKey, StoreSchema } from "pema";
import p from "pema";
import type { Sql } from "postgres";
import postgres from "postgres";

interface ExplainRow {
  "QUERY PLAN": string;
}

type UnsafeParams = Parameters<Sql["unsafe"]>[1];

const VALID_IDENTIFIER = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

function Q(strings: TemplateStringsArray, ...values: (string | unknown[])[]) {
  return strings.reduce((result, string, i) => {
    if (i === values.length) return result + string;

    const value = values[i];
    let processed: string;

    if (Array.isArray(value)) {
      processed = value.join(", ");
    } else if (typeof value === "string") {

      processed = quote(value);
    } else {
      throw "Q: use only strings or arrays";
    }

    return result + string + processed;
  }, "");
}

function is_bigint_key(k: string) {
  return k === "u64" || k === "u128" || k === "i64" || k === "i128";
}

function quote(name: string) {
  if (!VALID_IDENTIFIER.test(name)) throw E.identifier_invalid(name);
  return `"${name}"`;
}

function order_by(types: Types, sort?: Sort, alias?: string) {
  if (sort === undefined) return "";
  const entries = Object.entries(sort);
  if (entries.length === 0) return "";

  const parts = entries.map(([k, dir]) => {
    const d = String(dir).toLowerCase();
    const direction = d === "desc" ? "DESC" : "ASC";

    const base = alias !== undefined ? `${alias}.${quote(k)}` : quote(k);
    const datatype = types[k];

    // if bigint-ish might be stored as TEXT/NUMERIC, force numeric ordering
    const expression = is_bigint_key(datatype) ? `(${base})::numeric` : base;

    return `${expression} ${direction}`;
  });

  return ` ORDER BY ${parts.join(", ")}`;
}

function get_column(key: DataKey) {
  return typemap[key].column;
}

async function bind_value(key: DataKey, value: unknown) {
  if (value === null) return null;
  // typemap.bind may be sync or async; allow both
  return await typemap[key].bind(value as never);
}

function unbind_value(key: DataKey, value: unknown) {
  return typemap[key].unbind(value as never);
}

function unbind(types: Types, row: Dict) {
  return sql.unbind<ReturnType<typeof unbind_value>>(types, row, unbind_value);
}

function relation_order(types: Types, sort?: Sort) {
  if (sort === undefined) return "";
  const entries = Object.entries(sort);
  if (entries.length === 0) return "";

  return entries.map(([k, dir]) => {
    const direction = dir.toLowerCase() === "desc" ? "DESC" : "ASC";
    const expression = k in types && is_bigint_key(types[k])
      ? Q`(${k})::numeric`
      : Q`${k}`;
    return `${expression} ${direction}`;
  }).join(", ");
}

const BIND_BY = "$";

const schema = p({
  database: p.string,
  host: p.string.default("localhost"),
  password: p.string.optional(),
  port: p.uint.port().default(5432),
  username: p.string.optional(),
});

export default class PostgreSQL implements DB {
  static config: typeof schema.input;

  #factory: () => Sql;
  #client?: Sql;
  #debug = false;
  #explain: Dict<{ query: string; plans: string[] }> = {};

  constructor(config?: typeof schema.input, options?: { debug?: boolean }) {
    const parsed = schema.parse(config);

    this.#factory = () =>
      postgres({
        db: parsed.database,
        host: parsed.host,
        port: parsed.port,
        user: parsed.username,
        pass: parsed.password,
      });
    this.#debug = options?.debug ?? false;
  }

  get #db() {
    return (this.#client ??= this.#factory());
  }

  async #sql<T = unknown>(q: string, params?: unknown[]) {
    return await this.#db.unsafe(q, params as UnsafeParams) as T;
  }

  async #capture(name: string, query: string, params?: unknown[]) {
    if (!this.#debug) return;

    // Keep stored query exactly as executed (like SQLite)
    // but EXPLAIN must not end with a semicolon.
    const explain_target = query.trim().replace(/;+\s*$/, "");

    const rows = await this.#sql<ExplainRow[]>(
      `EXPLAIN ${explain_target}`,
      params,
    );

    const plans = rows.map(r => r["QUERY PLAN"]);

    this.#explain[name] = { query, plans };
  }

  async close() {
    await this.#db.end();
  }

  get explain() {
    return this.#explain;
  }

  async #where(as: As, where: DataDict, index = 1, alias?: string) {
    const keys = Object.keys(where);
    if (keys.length === 0) return { WHERE: "", params: [], next_index: index };

    const parts: string[] = [];
    const params: unknown[] = [];
    let i = index;

    for (const field of keys) {
      const raw = where[field];
      const datatype = as.types[field];
      const base = alias ? `${alias}.${quote(field)}` : quote(field);

      if (raw === null) {
        parts.push(`${base} IS NULL`);
        continue;
      }

      // operator object
      if (is.dict(raw)) {
        const ops = Object.entries(raw);
        if (ops.length === 0) throw E.operator_empty(field);

        for (const [op, op_value] of ops) {
          const ph = `$${i++}`;

          // bigint comparisons must be numeric, regardless of storage.
          const numeric = is_bigint_key(datatype);
          const lhs = numeric ? `(${base})::numeric` : base;
          const rhs = numeric ? `${ph}::numeric` : ph;

          switch (op) {
            case "$like":
              parts.push(`${base} LIKE ${ph}`);
              params.push(await bind_value(datatype, op_value));
              break;
            case "$ilike":
              parts.push(`${base} ILIKE ${ph}`);
              params.push(await bind_value(datatype, op_value));
              break;
            case "$ne":
              parts.push(`${lhs} != ${rhs}`);
              params.push(await bind_value(datatype, op_value));
              break;
            case "$gt":
            case "$gte":
            case "$lt":
            case "$lte":
            case "$after":
            case "$before": {
              const sql_op = sql.OPS[op];
              parts.push(`${lhs} ${sql_op} ${rhs}`);
              params.push(await bind_value(datatype, op_value));
              break;
            }
            default:
              throw E.operator_unknown(field, op);
          }
        }

        continue;
      }

      // scalar equality
      const ph = `$${i++}`;
      parts.push(`${base} = ${ph}`);
      params.push(await bind_value(datatype, raw));
    }

    return {
      WHERE: `WHERE ${parts.join(" AND ")}`,
      params,
      next_index: i,
    };
  }

  get schema() {
    return {
      create: async (as: As, store: StoreSchema) => {
        const columns: string[] = [];
        for (const [key, value] of Object.entries(store)) {
          const column_type = get_column(value.datatype);
          const column = quote(key);
          if (key === as.pk) {
            const is_int = ["INTEGER", "BIGINT"].includes(column_type);
            if (as.generate_pk && is_int) {
              const serial = column_type === "BIGINT" ? "BIGSERIAL" : "SERIAL";
              columns.push(`${column} ${serial} PRIMARY KEY`);
            } else {
              columns.push(`${column} ${column_type} PRIMARY KEY`);
            }
          } else {
            columns.push(`${column} ${column_type}`);
          }
        }

        await this.#sql(Q`CREATE TABLE IF NOT EXISTS ${as.table} (${columns})`);
      },

      delete: async (name: string) => {
        await this.#sql(Q`DROP TABLE IF EXISTS ${name}`);
      },
    };
  }

  async #generate_pk(as: As) {
    const pk = as.pk!;
    const type = as.types[pk];

    if (type === "string") return crypto.randomUUID();

    if (common.BIGINT_STRING_TYPES.includes(type)) {
      const q = Q`SELECT MAX((${pk})::numeric)::text AS v FROM ${as.table}`;
      const rows = await this.#sql(q) as { v: PK }[];
      return rows[0]?.v ? BigInt(rows[0].v) + 1n : 1n;
    }

    throw "unreachable";
  }

  #create(record: Dict) {
    const fields = Object.keys(record);
    return [
      fields.map(quote),
      fields.map((_, i) => `${BIND_BY}${i + 1}`),
    ];
  }

  async #create_params(as: As, record: Dict) {
    const fields = Object.keys(record);
    const params: unknown[] = [];
    for (const field of fields) {
      params.push(await bind_value(as.types[field], record[field]));
    }
    return params;
  }

  async create<O extends Dict>(as: As, record: Dict): Promise<O> {
    assert.dict(record);

    const pk = as.pk;
    const has_values = Object.keys(record).length > 0;
    const table = as.table;

    // PK provided or none defined, simple insert
    if (pk === null || pk in record) {
      if (!has_values) {
        await this.#sql(Q`INSERT INTO ${table} DEFAULT VALUES`);
        return record as O;
      }

      const [keys, values] = this.#create(record);
      const params = await this.#create_params(as, record);
      const q = Q`INSERT INTO ${table} (${keys}) VALUES (${values})`;
      await this.#sql(q, params);
      return record as O;
    }

    // PK missing
    if (as.generate_pk === false) throw E.pk_required(pk);

    const type = as.types[pk];

    // integer types, use RETURNING
    if (!is_bigint_key(type) && type !== "string") {
      const [keys, values] = this.#create(record);
      const params = await this.#create_params(as, record);
      const q = has_values
        ? Q`INSERT INTO ${table} (${keys}) VALUES (${values}) RETURNING ${pk}`
        : Q`INSERT INTO ${table} DEFAULT VALUES RETURNING ${pk}`;
      const rows = await this.#sql(q, params) as Dict[];
      const pk_value = unbind_value(type, rows[0][pk]);
      return { ...record, [pk]: pk_value } as O;
    }

    // string or bigint, generate manually
    const pk_value = await this.#generate_pk(as);
    const to_insert = { ...record, [pk]: pk_value };
    const [keys, values] = this.#create(to_insert);
    const params = await this.#create_params(as, to_insert);
    const q = Q`INSERT INTO ${table} (${keys}) VALUES (${values})`;
    await this.#sql(q, params);
    return to_insert as O;
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
  async read(
    as: As,
    args: {
      count?: true;
      where: DataDict;
      fields?: string[];
      limit?: number;
      sort?: Sort;
      with?: With;
    },
  ) {
    assert.dict(args.where);

    this.#explain = {};

    if (args.count === true) return this.#count(as, args.where);

    if (common.withed(args)) {
      return sql.joinable(as, args.with)
        ? this.#read_joined(as, args)
        : this.#read_phased(as, args);
    }

    return this.#read(as, args);
  }

  async #count(as: As, where: DataDict) {
    const { WHERE, params } = await this.#where(as, where);
    const q = `SELECT COUNT(*)::text AS n FROM ${quote(as.table)} ${WHERE}`;
    const rows = await this.#sql(q, params) as { n: string }[];
    await this.#capture(as.table, q, params);

    return Number(rows[0]?.n ?? 0);
  }

  async #base_query(as: As, args: {
    fields?: string[];
    where: DataDict;
    sort?: Sort;
    limit?: number;
  }): Promise<{ query: string; params: unknown[] }> {
    const SELECT = args.fields === undefined
      ? "*"
      : args.fields.map(quote).join(", ");
    const table = quote(as.table);
    const { WHERE, params } = await this.#where(as, args.where);
    const ORDER_BY = order_by(as.types, args.sort);
    const LIMIT = sql.limit(args.limit);
    return {
      query: `SELECT ${SELECT} FROM ${table} ${WHERE}${ORDER_BY}${LIMIT}`,
      params,
    };
  }

  async #read_joined(as: As, args: ReadRelationsArgs): Promise<Dict[]> {
    if (as.pk === null) throw E.relation_requires_pk("parent");

    const [[, relation]] = Object.entries(args.with);
    if (relation.as.pk === null) throw E.relation_requires_pk("target");

    const aliases = sql.aliases([as.table, relation.as.table]);
    const alias = aliases[as.table];
    const r_alias = aliases[relation.as.table];

    const fields = common.fields(args.fields, as.pk) ?? Object.keys(as.types);
    const r_fields = common.fields(relation.fields, relation.fk, relation.as.pk)
      ?? Object.keys(relation.as.types);

    const SELECT = [
      ...fields.map(f => `${alias}.${quote(f)} AS ${alias}_${f}`),
      ...r_fields.map(f => `${r_alias}.${quote(f)} AS ${r_alias}_${f}`),
    ].join(", ");

    const { query, params } = await this.#base_query(as, { ...args, fields });
    const JOIN = `LEFT JOIN ${quote(relation.as.table)} ${r_alias}
      ON ${r_alias}.${quote(relation.fk)} = ${alias}.${quote(as.pk)}`;
    const q = `SELECT ${SELECT} FROM (${query}) ${alias}
      ${JOIN}${order_by(as.types, args.sort, alias)}`;

    const rows = await this.#sql(q, params) as Dict[];
    await this.#capture(as.table, q, params);

    return sql.nest(as, { rows, aliases }, args, unbind_value);
  }

  async #read(as: As, args: ReadArgs) {
    const { query, params } = await this.#base_query(as, args);
    const rows = await this.#sql(query, params) as Dict[];
    await this.#capture(as.table, query, params);
    return rows.map(r => unbind(as.types, r));
  }

  async #read_phased(as: As, args: ReadRelationsArgs) {
    const fields = common.expand(as, args.fields, args.with);
    const rows = await this.#read(as, { ...args, fields });
    const out = rows.map(row => common.project(row, args.fields));

    for (const [table, relation] of Object.entries(args.with)) {
      await this.#attach_relation(as, { rows, out, table, relation });
    }

    return out;
  }

  async #attach_relation(
    as: As,
    args: {
      rows: Dict[];
      out: Dict[];
      table: string;
      relation: NonNullable<With[string]>;
    },
  ) {
    const relation = args.relation;

    const by = relation.reverse ? relation.as.pk : relation.fk;
    if (by === null) throw E.relation_requires_pk("target");

    const parent_by = relation.reverse ? relation.fk : as.pk;
    if (parent_by === null) throw E.relation_requires_pk("parent");

    const join_values = [...new Set(
      args.rows.map(r => r[parent_by]).filter(v => v != null),
    )];

    const is_many = relation.kind === "many";
    const many = is_many ? [] : null;

    if (join_values.length === 0) {
      for (const row of args.out) row[args.table] = many;
      return;
    }

    const related = await this.#load_related({ by, join_values, ...relation });
    const grouped = new Map<unknown, Dict[]>();

    for (const row of related) {
      const key = row[by];
      if (key === null) continue;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(row);
    }

    for (let i = 0; i < args.out.length; i++) {
      const join_value = args.rows[i][parent_by];

      if (join_value == null) {
        args.out[i][args.table] = is_many ? [] : null;
        continue;
      }

      const rows = grouped.get(join_value) ?? [];
      args.out[i][args.table] = is_many
        ? rows.map(r => common.project(r, relation.fields))
        : rows[0] ? common.project(rows[0], relation.fields) : null;
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
  }): Promise<Dict[]> {
    const per_parent = args.kind === "one" ? 1 : args.limit;

    // build WHERE, excluding the IN clause
    const { WHERE: _where, params: where_params, next_index } =
      await this.#where(args.as, args.where);
    const where_part = _where.length > 0 ? _where.slice("WHERE ".length) : "";

    // build IN (...) placeholders and binds
    const datatype = args.as.types[args.by];
    const numeric = is_bigint_key(datatype);

    let next_i = next_index;
    const in_placeholders: string[] = [];
    const in_params: unknown[] = [];

    for (const v of args.join_values) {
      const ph = `$${next_i++}`;
      in_placeholders.push(numeric ? `${ph}::numeric` : ph);
      in_params.push(await bind_value(datatype, v));
    }

    const lhs = numeric ? `(${quote(args.by)})::numeric` : quote(args.by);
    const in_part = `${lhs} IN (${in_placeholders.join(", ")})`;

    const WHERE = where_part
      ? `WHERE (${where_part}) AND (${in_part})`
      : `WHERE ${in_part}`;

    // SELECT fields, must include `by` for grouping
    const all_columns = Object.keys(args.as.types);
    const fields = args.fields !== undefined && args.fields.length > 0
      ? args.fields
      : all_columns;
    const select_fields = [...new Set([...fields, args.by])];
    const SELECT = select_fields.map(quote).join(", ");

    // relation sort, used both for row_number ranking and final ordering
    const user_order = relation_order(args.as.types, args.sort);
    const base_order = numeric
      ? `(${quote(args.by)})::numeric ASC`
      : `${quote(args.by)} ASC`;

    const ORDER_BY = user_order
      ? ` ORDER BY ${base_order}, ${user_order}`
      : ` ORDER BY ${base_order}`;

    let q: string;

    const table = quote(args.as.table);

    if (per_parent !== undefined) {
      const rn_order = user_order ? ` ORDER BY ${user_order}` : "";

      q = `
        WITH ranked AS (
          SELECT
            ${SELECT},
            ROW_NUMBER() OVER (
              PARTITION BY ${numeric ? Q`(${args.by})::numeric` : Q`${args.by}`}
              ${rn_order}
            ) AS __rn
          FROM ${table}
          ${WHERE}
        )
        SELECT ${SELECT}
        FROM ranked
        WHERE __rn <= ${per_parent}
        ${ORDER_BY}
      `;
    } else {
      q = `SELECT ${SELECT} FROM ${table} ${WHERE}${ORDER_BY}`;
    }

    const params = [...where_params, ...in_params];
    const rows = await this.#sql(q, params) as Dict[];
    await this.#capture(args.as.table, q, params);
    return rows.map(r => unbind(args.as.types, r));
  }

  async update(as: As, args: { set: DataDict; where: DataDict }) {
    assert.nonempty(args.set);
    assert.dict(args.where);

    const set_keys = Object.keys(args.set);
    const set_parts: string[] = [];
    const set_params: unknown[] = [];
    let i = 1;

    for (const k of set_keys) {
      const ph = `$${i++}`;
      set_parts.push(`${quote(k)} = ${ph}`);
      set_params.push(await bind_value(as.types[k], args.set[k]));
    }

    const SET = `SET ${set_parts.join(", ")}`;
    const { WHERE, params } = await this.#where(as, args.where, i);

    const q = `UPDATE ${quote(as.table)} ${SET} ${WHERE} RETURNING 1`;
    const rows = await this.#sql(q, [...set_params, ...params]) as unknown[];
    return rows.length;
  }

  async delete(as: As, args: { where: DataDict }) {
    assert.nonempty(args.where);

    const { WHERE, params } = await this.#where(as, args.where);
    const q = `DELETE FROM ${quote(as.table)} ${WHERE} RETURNING 1`;
    const rows = await this.#sql(q, params) as unknown[];
    return rows.length;
  }
}
