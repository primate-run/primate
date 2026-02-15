import typemap from "#typemap";
import type {
  As, DataDict, DB,
  ReadArgs, ReadRelationsArgs,
  Sort, Types, With,
} from "@primate/core/db";
import common from "@primate/core/db";
import E from "@primate/core/db/error";
import sql from "@primate/core/db/sql";
import assert from "@rcompat/assert";
import is from "@rcompat/is";
import type { Dict } from "@rcompat/type";
import type { Pool, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import mysql from "mysql2/promise";
import type { DataKey, StoreSchema } from "pema";
import p from "pema";

const BIND_BY = ":";
const Q = sql.Q;

function bigint_cast(arg: string) {
  return `CAST(${arg} AS DECIMAL(65,0))`;
}

function is_bigint_key(k: string) {
  return k === "u64" || k === "u128" || k === "i64" || k === "i128";
}

function order_by(types: Types, sort?: Sort, alias?: string) {
  if (sort === undefined) return "";
  const entries = Object.entries(sort);
  if (entries.length === 0) return "";

  const parts = entries.map(([k, dir]) => {
    const quoted = sql.quote(k);
    const base = alias ? `${alias}.${quoted}` : quoted;
    const expression = is_bigint_key(types[k]) ? bigint_cast(base) : base;
    return `${expression} ${dir.toLowerCase() === "desc" ? "DESC" : "ASC"}`;
  });

  return ` ORDER BY ${parts.join(", ")}`;
}

function get_column(key: DataKey) {
  return typemap[key].column;
}

async function bind_value(key: DataKey, value: unknown) {
  if (value === null) return null;
  return await typemap[key].bind(value as never);
}

function unbind_value(key: DataKey, value: unknown) {
  return typemap[key].unbind(value as never);
}

function unbind(types: Types, row: Dict) {
  return sql.unbind<ReturnType<typeof unbind_value>>(types, row, unbind_value);
}

const schema = p({
  database: p.string,
  host: p.string.default("localhost"),
  password: p.string.optional(),
  port: p.uint.port().default(3306),
  username: p.string.optional(),
});

export default class MySQL implements DB {
  static config: typeof schema.input;

  #factory: () => Pool;
  #client?: Pool;
  #debug = false;
  #explain: Dict<{ query: string; plans: string[] }> = {};

  constructor(config?: typeof schema.input, options?: { debug?: boolean }) {
    const parsed = schema.parse(config);
    this.#factory = () => mysql.createPool({
      host: parsed.host,
      port: parsed.port,
      database: parsed.database,
      user: parsed.username,
      password: parsed.password,
      namedPlaceholders: true,
      bigNumberStrings: true,
      supportBigNumbers: true,
    });
    this.#debug = options?.debug ?? false;
  }

  get #db() {
    return this.#client ??= this.#factory();
  }

  async #sql<T = RowDataPacket[]>(query: string, params?: Dict) {
    const [rows] = await this.#db.query(query, params);
    return rows as T;
  }

  async #execute<T = ResultSetHeader>(query: string, params?: Dict) {
    const [result] = await this.#db.execute(query, params);
    return result as T;
  }

  async #capture(table: string, query: string, params?: Dict) {
    if (!this.#debug) return;
    const rows = await this.#sql<RowDataPacket[]>(`EXPLAIN ${query}`, params);
    this.#explain[table] = { query, plans: rows.map(r => JSON.stringify(r)) };
  }

  get explain() {
    return this.#explain;
  }

  async close() {
    await this.#db.end();
  }

  get schema() {
    return {
      create: async (as: As, store: StoreSchema) => {
        const columns: string[] = [];

        for (const [key, value] of Object.entries(store)) {
          const type = get_column(value.datatype);
          if (key === as.pk) {
            const is_int = common.INT_TYPES.includes(value.datatype);
            const auto = as.generate_pk && is_int ? " AUTO_INCREMENT" : "";
            // 36 is UUID length
            const pk_type = value.datatype === "string" ? "VARCHAR(36)" : type;
            columns.push(`${sql.quote(key)} ${pk_type} PRIMARY KEY${auto}`);
          } else {
            columns.push(`${sql.quote(key)} ${type}`);
          }
        }

        await this.#sql(Q`CREATE TABLE IF NOT EXISTS ${as.table} (${columns})`);
      },
      delete: async (table: string) => {
        await this.#sql(Q`DROP TABLE IF EXISTS ${table}`);
      },
    };
  }

  async #where(as: As, where: DataDict): Promise<[string, Dict]> {
    const fields = Object.keys(where);
    if (fields.length === 0) return ["", {} as Dict];

    const parts: string[] = [];
    const binds: Dict = {};

    for (const field of fields) {
      const value = where[field];
      const datatype = as.types[field];
      const q = sql.quote(field);
      const quoted = q;

      if (value === null) {
        parts.push(`${quoted} IS NULL`);
        continue;
      }

      if (is.dict(value)) {
        const ops = Object.entries(value);
        if (ops.length === 0) throw E.operator_empty(field);

        for (const [op, op_value] of ops) {
          const bind_key = sql.bindKey(field, op);
          const ph = `${BIND_BY}${bind_key}`;
          const numeric = is_bigint_key(datatype);
          const lhs = numeric ? bigint_cast(quoted) : quoted;
          const rhs = numeric ? bigint_cast(ph) : ph;
          binds[bind_key] = await bind_value(datatype, op_value);

          switch (op) {
            case "$like":
              parts.push(`${quoted} LIKE BINARY ${ph}`);
              break;
            case "$ilike":
              parts.push(`LOWER(${quoted}) LIKE LOWER(${ph})`);
              break;
            case "$ne":
              parts.push(`${lhs} != ${rhs}`);
              break;
            case "$gt":
            case "$gte":
            case "$lt":
            case "$lte":
            case "$after":
            case "$before": {
              const sql_op = sql.OPS[op];
              parts.push(`${lhs} ${sql_op} ${rhs}`);
              break;
            }
            default:
              throw E.operator_unknown(field, op);
          }
        }
        continue;
      }

      parts.push(`${quoted} = ${BIND_BY}${field}`);
      binds[field] = await bind_value(datatype, value);
    }

    return [`WHERE ${parts.join(" AND ")}`, binds];
  }

  #set(set: DataDict) {
    const columns = Object.keys(set);
    if (columns.length === 0) throw E.field_required("set");
    return Q`SET ${columns.map(c => `${sql.quote(c)}=${BIND_BY}s_${c}`)}`;
  }

  async #bind_set(types: Types, set: DataDict) {
    const columns = Object.keys(set);
    if (columns.length === 0) throw E.field_required("set");

    const params: Dict = {};
    for (const c of columns) {
      params[`s_${c}`] = await bind_value(types[c], set[c]);
    }
    return params;
  }

  async #generate_pk(as: As) {
    const pk = as.pk!;
    const type = as.types[pk];
    const table = as.table;

    if (type === "string") return crypto.randomUUID();

    if (common.BIGINT_STRING_TYPES.includes(type)) {
      const cast = bigint_cast(sql.quote(pk));
      const q = `SELECT MAX(${cast}) AS v FROM ${sql.quote(table)}`;
      const rows = await this.#sql<RowDataPacket[]>(q);
      const v = rows[0]?.v;
      return v ? BigInt(v) + 1n : 1n;
    }

    throw "unreachable";
  }

  #create(record: Dict) {
    const fields = Object.keys(record);
    return [
      fields.map(sql.quote),
      fields.map(field => `${BIND_BY}${field}`),
    ];
  }

  async #create_params(types: Types, record: Dict) {
    const params: Dict = {};
    for (const k of Object.keys(record)) {
      params[k] = await bind_value(types[k], record[k]);
    }
    return params;
  }

  async create<O extends Dict>(as: As, record: Dict): Promise<O> {
    assert.dict(record);

    const pk = as.pk;
    const table = as.table;

    // PK provided or none defined, simple insert
    if (pk === null || pk in record) {
      const [keys, values] = this.#create(record);
      const query = keys.length > 0
        ? Q`INSERT INTO ${table} (${keys}) VALUES (${values})`
        : Q`INSERT INTO ${table} () VALUES ()`;
      await this.#sql(query, await this.#create_params(as.types, record));
      return record as O;
    }

    if (as.generate_pk === false) throw E.pk_required(pk);

    const type = as.types[pk];

    // integer types, use AUTO_INCREMENT
    if (!common.BIGINT_STRING_TYPES.includes(type) && type !== "string") {
      const [keys, values] = this.#create(record);
      const query = keys.length > 0
        ? Q`INSERT INTO ${table} (${keys}) VALUES (${values})`
        : Q`INSERT INTO ${table} () VALUES ()`;
      const result = await this.#execute<ResultSetHeader>(query,
        await this.#create_params(as.types, record));
      const pk_value = unbind_value(type, result.insertId);
      return { ...record, [pk]: pk_value } as O;
    }

    // string or bigint, generate manually
    const pk_value = await this.#generate_pk(as);
    const to_insert = { ...record, [pk]: pk_value } as DataDict;
    const [keys, values] = this.#create(to_insert);
    const query = Q`INSERT INTO ${table} (${keys}) VALUES (${values})`;
    await this.#sql(query, await this.#create_params(as.types, to_insert));
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

    if (common.withed(args)) {
      return sql.joinable(as, args.with)
        ? this.#read_joined(as, args)
        : this.#read_phased(as, args);
    }

    return this.#read(as, args);
  }

  async #count(as: As, where: DataDict) {
    const [WHERE, binds] = await this.#where(as, where);
    const table = as.table;
    const query = `SELECT COUNT(*) AS n FROM ${sql.quote(table)} ${WHERE}`;
    const rows = await this.#sql<RowDataPacket[]>(query, binds);
    await this.#capture(table, query, binds);
    return Number(rows[0]?.n ?? 0);
  }

  async #base_query(as: As, args: {
    fields?: string[];
    where: DataDict;
    sort?: Sort;
    limit?: number;
  }) {
    const SELECT = args.fields === undefined
      ? "*"
      : args.fields.map(sql.quote).join(", ");
    const [WHERE, binds] = await this.#where(as, args.where);
    const ORDER_BY = order_by(as.types, args.sort);
    const LIMIT = sql.limit(args.limit);
    const table = sql.quote(as.table);
    return [
      `SELECT ${SELECT} FROM ${table} ${WHERE}${ORDER_BY}${LIMIT}`,
      binds,
    ] as const;
  }

  async #read(as: As, args: ReadArgs) {
    const [query, binds] = await this.#base_query(as, args);
    const rows = await this.#sql<RowDataPacket[]>(query, binds);
    await this.#capture(as.table, query, binds);
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

  async #attach_relation(as: As, args: {
    rows: Dict[];
    out: Dict[];
    table: string;
    relation: NonNullable<With[string]>;
  }) {
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
      grouped.set(key, grouped.get(key)?.concat(row) ?? [row]);
    }

    for (let i = 0; i < args.out.length; i++) {
      const join_value = args.rows[i][parent_by];

      if (join_value == null) {
        args.out[i][args.table] = many;
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
  }) {
    const per_parent = args.kind === "one" ? 1 : args.limit;
    const in_binds: Dict = {};
    const placeholders: string[] = [];

    for (let i = 0; i < args.join_values.length; i++) {
      const key = `${args.by}__in${i}`;
      in_binds[key] = await bind_value(args.as.types[args.by],
        args.join_values[i]);
      placeholders.push(`${BIND_BY}${key}`);
    }

    const [where, where_binds] = await this.#where(args.as, args.where);
    const where_part = where ? where.slice("WHERE ".length) : "";
    const numeric = is_bigint_key(args.as.types[args.by]);
    const in_placeholders = numeric
      ? placeholders.map(bigint_cast)
      : placeholders;
    const cast = bigint_cast(sql.quote(args.by));

    const lhs = numeric ? cast : Q`${args.by}`;
    const in_part = `${lhs} IN (${in_placeholders.join(", ")})`;

    const where_parts = where_part
      ? [`(${where_part})`, `(${in_part})`]
      : [in_part];
    const WHERE = `WHERE ${where_parts.join(" AND ")}`;

    const all_columns = Object.keys(args.as.types);
    const fields = args.fields !== undefined && args.fields.length > 0
      ? args.fields
      : all_columns;
    const select_fields = [...new Set([...fields, args.by])];
    const SELECT = select_fields.map(sql.quote).join(", ");

    const base_order = `${numeric ? cast : Q`${args.by}`} ASC`;
    const user_order = order_by(args.as.types, args.sort)
      .replace(/^ ORDER BY /, "");
    const ORDER_BY = user_order
      ? ` ORDER BY ${base_order}, ${user_order}`
      : ` ORDER BY ${base_order}`;

    const table = sql.quote(args.as.table);
    let query: string;

    if (per_parent !== undefined) {
      const partition = numeric ? cast : Q`${args.by}`;
      const rn_order = user_order ? ` ORDER BY ${user_order}` : "";

      query = `
        SELECT ${SELECT} FROM (
          SELECT
            ${SELECT},
            ROW_NUMBER() OVER (
              PARTITION BY ${partition}
              ${rn_order}
            ) AS __rn
          FROM ${table}
          ${WHERE}
        ) ranked
        WHERE __rn <= ${per_parent}
        ${ORDER_BY}
      `;
    } else {
      query = `SELECT ${SELECT} FROM ${table} ${WHERE}${ORDER_BY}`;
    }

    const binds = { ...where_binds, ...in_binds };
    const rows = await this.#sql<RowDataPacket[]>(query, binds);
    await this.#capture(args.as.table, query, binds);
    return rows.map(r => unbind(args.as.types, r));
  }

  #join(as: As, aliases: Dict<string>, relation: NonNullable<With[string]>) {
    const parent_alias = aliases[as.table];
    const alias = aliases[relation.as.table];
    const table = sql.quote(relation.as.table);

    const by = relation.reverse ? relation.as.pk : relation.fk;
    const parent_by = relation.reverse ? relation.fk : as.pk;

    if (by === null) throw E.relation_requires_pk("target");
    if (parent_by === null) throw E.relation_requires_pk("parent");

    const left = `${alias}.${sql.quote(by)}`;
    const right = `${parent_alias}.${sql.quote(parent_by)}`;

    return `LEFT JOIN ${table} ${alias} ON ${left} = ${right}`;
  }

  async #read_joined(as: As, args: ReadRelationsArgs): Promise<Dict[]> {
    if (as.pk === null) throw E.relation_requires_pk("parent");

    const tables = [as.table, ...Object.values(args.with).map(r => r.as.table)];
    const aliases = sql.aliases(tables);
    const alias = aliases[as.table];
    const fields = common.fields(args.fields, as.pk) ?? Object.keys(as.types);

    const SELECT = [
      ...fields.map(f => `${alias}.${sql.quote(f)} AS ${alias}_${f}`),
      ...Object.values(args.with).flatMap(relation => {
        const r_alias = aliases[relation.as.table];
        const r_fields = relation.as.pk !== null
          ? common.fields(relation.fields, relation.as.pk)
          : relation.fields;
        return (r_fields ?? Object.keys(relation.as.types))
          .map(f => `${r_alias}.${sql.quote(f)} AS ${r_alias}_${f}`);
      }),
    ].join(", ");

    const [SUBQUERY, binds] = await this.#base_query(as, { ...args, fields });
    const FROM = `(${SUBQUERY}) ${alias}`;
    const JOINS = Object.values(args.with)
      .map(relation => this.#join(as, aliases, relation))
      .join("\n");
    const ORDER_BY = order_by(as.types, args.sort, alias);

    const query = `SELECT ${SELECT} FROM ${FROM} ${JOINS} ${ORDER_BY}`;
    const rows = await this.#sql<RowDataPacket[]>(query, binds);

    this.#capture(as.table, query, binds);

    return sql.nest(as, { rows, aliases }, args, unbind_value);
  }

  async update(as: As, args: { set: DataDict; where: DataDict }) {
    assert.nonempty(args.set);
    assert.dict(args.where);

    const [WHERE, where_binds] = await this.#where(as, args.where);
    const SET = this.#set(args.set);
    const set_binds = await this.#bind_set(as.types, args.set);
    const query = `UPDATE ${sql.quote(as.table)} ${SET} ${WHERE}`;
    const binds = { ...where_binds, ...set_binds };

    const result = await this.#execute<ResultSetHeader>(query, binds);
    return result.affectedRows;
  }

  async delete(as: As, args: { where: DataDict }) {
    assert.nonempty(args.where);

    const [WHERE, binds] = await this.#where(as, args.where);
    const query = `DELETE FROM ${sql.quote(as.table)} ${WHERE}`;
    const result = await this.#execute<ResultSetHeader>(query, binds);
    return result.affectedRows;
  }
}
