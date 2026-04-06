import typemap from "#typemap";
import type {
  As, DataDict, DB,
  ReadArgs, ReadRelationsArgs, Schema, Sort, Types, With,
} from "@primate/core/db";
import base from "@primate/core/db";
import E from "@primate/core/db/errors";
import sql from "@primate/core/db/sql";
import assert from "@rcompat/assert";
import is from "@rcompat/is";
import type { Dict } from "@rcompat/type";
import oracledb from "oracledb";
import type { DataKey } from "pema";
import p from "pema";

const VALID_IDENTIFIER = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

function quote(name: string) {
  if (!VALID_IDENTIFIER.test(name)) throw E.identifier_invalid(name);
  return `"${name}"`;
}

function get_column(key: DataKey) {
  return typemap[key].column;
}

async function bind_value(key: DataKey, value: unknown) {
  if (value === null) return null;

  return typemap[key].bind(value as never);
}

function order_by(types: Types, sort?: Sort) {
  if (sort === undefined) return "";
  const entries = Object.entries(sort);
  if (entries.length === 0) return "";

  return ` ORDER BY ${entries.map(([k, dir]) => {
    const direction = dir.toLowerCase() === "desc" ? "DESC" : "ASC";
    return `${quote(k)} ${direction}`;
  }).join(", ")}`;
}

interface IntrospectRow {
  column_name: string;
  data_type: string;
  data_length: number | null;
  char_length: number | null;
  data_precision: number | null;
  data_scale: number | null;
}

function oracle_columns_to_types(row: IntrospectRow): DataKey[] {
  const data_type = row.data_type.toUpperCase();
  const char_length = Number(row.char_length ?? row.data_length ?? 0);
  const precision = row.data_precision === null
    ? null
    : Number(row.data_precision);
  const scale = row.data_scale === null ? 0 : Number(row.data_scale);

  if (data_type === "BLOB") return ["blob"];
  if (data_type === "BOOLEAN") return ["boolean"];
  if (data_type === "BINARY_FLOAT") return ["f32"];
  if (data_type === "BINARY_DOUBLE") return ["f64"];
  if (data_type === "JSON") return ["json"];

  if (data_type.startsWith("TIMESTAMP")) return ["datetime"];

  if (data_type === "VARCHAR2") {
    if (char_length === 36) return base.UUID_TYPES;
    if (char_length === 40) return ["i128", "u128"];
    if (char_length === 4000) return ["string", "time", "url"];
    return ["string"];
  }

  if (data_type === "NUMBER" && scale === 0) {
    if (precision === 3) return ["i8", "u8"];
    if (precision === 5) return ["i16", "u16"];
    if (precision === 10) return ["i32", "u32"];
    if (precision === 20) return ["i64", "u64"];
  }

  return [];
}

function limit(n?: number) {
  return n === undefined ? "" : ` FETCH FIRST ${n} ROWS ONLY`;
}

function unbind_value(key: DataKey, value: unknown) {
  return typemap[key].unbind(value as never);
}

function unbind(types: Types, row: Dict) {
  return sql.unbind<ReturnType<typeof unbind_value>>(types, row, unbind_value);
}

const schema = p({
  host: p.string.default("localhost"),
  port: p.uint.port().default(1521),
  database: p.string,
  username: p.string.optional(),
  password: p.string.optional(),
});

export default class OracleDB implements DB<oracledb.Connection> {
  static config: typeof schema.input;

  #connection?: oracledb.Connection;
  #config: typeof schema.infer;
  #debug = false;
  #explain: Dict<{ query: string }> = {};

  constructor(config?: typeof schema.input, options?: { debug?: boolean }) {
    this.#config = schema.parse(config);
    this.#debug = options?.debug ?? false;
  }

  get client() {
    return this.#connection!;
  }

  get #db() {
    return this.#connection!;
  }

  async #connect() {
    if (this.#connection === undefined) {
      const { username, password, host, port, database } = this.#config;
      this.#connection = await oracledb.getConnection({
        user: username,
        password,
        connectString: `${host}:${port}/${database}`,
      });
      // return objects as plain dicts with lowercase keys
      this.#connection.callTimeout = 0;
    }
    return this.#connection;
  }

  async #sql<Out = unknown>(q: string, params: unknown[] = []): Promise<Out> {
    const conn = await this.#connect();

    const EXECUTE_OPTIONS = {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      // fetch NUMBER columns as strings to preserve bigint precision
      fetchTypeHandler(metadata: any) {
        if (metadata.dbType === oracledb.DB_TYPE_NUMBER) {
          return { type: oracledb.STRING };
        }
      },
    };
    const result = await conn.execute(q, params, {
      ...EXECUTE_OPTIONS,
      autoCommit: false,
    });
    // lowercase all keys
    return (result.rows ?? []).map((row: any) =>
      Object.fromEntries(
        Object.entries(row).map(([k, v]) => [k.toLowerCase(), v]),
      ),
    ) as Out;
  }

  async #where(as: As, where: DataDict, index = 1) {
    const keys = Object.keys(where);
    if (keys.length === 0) return { WHERE: "", params: [], next_index: index };

    const parts: string[] = [];
    const params: unknown[] = [];
    let i = index;

    for (const field of keys) {
      const raw = where[field];
      const datatype = as.types[field];
      const col = quote(field);

      if (raw === null) {
        parts.push(`${col} IS NULL`);
        continue;
      }

      if (is.dict(raw)) {
        const ops = Object.entries(raw);
        if (ops.length === 0) throw E.operator_empty(field);

        for (const [op, op_value] of ops) {
          const placeholder = `:${i++}`;
          switch (op) {
            case "$like":
              parts.push(`${col} LIKE ${placeholder} ESCAPE '\\'`);
              params.push(await bind_value(datatype, op_value));
              break;
            case "$ilike":
              parts.push(`UPPER(${col}) LIKE UPPER(${placeholder}) ESCAPE '\\'`);
              params.push(await bind_value(datatype, op_value));
              break;
            case "$ne":
              parts.push(`${col} != ${placeholder}`);
              params.push(await bind_value(datatype, op_value));
              break;
            case "$gt":
            case "$gte":
            case "$lt":
            case "$lte":
            case "$after":
            case "$before": {
              const sql_op = sql.OPS[op];
              parts.push(`${col} ${sql_op} ${placeholder}`);
              params.push(await bind_value(datatype, op_value));
              break;
            }
            default:
              throw E.operator_unknown(field, op);
          }
        }
        continue;
      }

      parts.push(`${col} = :${i++}`);
      params.push(await bind_value(datatype, raw));
    }

    return {
      WHERE: `WHERE ${parts.join(" AND ")}`,
      params,
      next_index: i,
    };
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
    const LIMIT = limit(args.limit);
    return {
      query: `SELECT ${SELECT} FROM ${table} ${WHERE}${ORDER_BY}${LIMIT}`,
      params,
    };
  }

  async #read(as: As, args: ReadArgs) {
    const { query, params } = await this.#base_query(as, args);
    const rows = await this.#sql<Dict[]>(query, params);
    return rows.map(r => unbind(as.types, r));
  }

  async #count(as: As, where: DataDict) {
    const { WHERE, params } = await this.#where(as, where);
    const q = `SELECT COUNT(*) AS n FROM ${quote(as.table)} ${WHERE}`;
    const rows = await this.#sql<{ n: number }[]>(q, params);
    return Number(rows[0]?.n ?? 0);
  }

  async #read_joined(as: As, args: ReadRelationsArgs): Promise<Dict[]> {
    if (as.pk === null) throw E.relation_requires_pk("parent");

    const [[, relation]] = Object.entries(args.with);
    if (relation.as.pk === null) throw E.relation_requires_pk("target");

    const aliases = sql.aliases([as.table, relation.as.table]);
    const alias = aliases[as.table];
    const r_alias = aliases[relation.as.table];

    const fields = base.fields(args.fields, as.pk) ?? Object.keys(as.types);
    const r_fields = base.fields(relation.fields, relation.fk, relation.as.pk)
      ?? Object.keys(relation.as.types);

    const SELECT = [
      ...fields.map(f => `${alias}.${quote(f)} AS ${alias}_${f}`),
      ...r_fields.map(f => `${r_alias}.${quote(f)} AS ${r_alias}_${f}`),
    ].join(", ");

    const { query, params } = await this.#base_query(as, { ...args, fields });
    const JOIN = `LEFT JOIN ${quote(relation.as.table)} ${r_alias}
    ON ${r_alias}.${quote(relation.fk)} = ${alias}.${quote(as.pk)}`;
    const q = `SELECT ${SELECT} FROM (${query}) ${alias} ${JOIN}`;

    const rows = await this.#sql<Dict[]>(q, params);
    return sql.nest(as, { rows, aliases }, args, unbind_value);
  }

  async #read_phased(as: As, args: ReadRelationsArgs): Promise<Dict[]> {
    const fields = base.expand(as, args.fields, args.with);
    const rows = await this.#read(as, { ...args, fields });
    const out = rows.map(row => base.project(row, args.fields));

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
    const by = relation.reverse === true ? relation.as.pk : relation.fk;
    if (by === null) throw E.relation_requires_pk("target");

    const parent_by = relation.reverse === true ? relation.fk : as.pk;
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
        ? rows.map(r => base.project(r, relation.fields))
        : rows[0] ? base.project(rows[0], relation.fields) : null;
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

    const { WHERE: _where, params: where_params, next_index } =
      await this.#where(args.as, args.where);
    const where_part = _where.length > 0 ? _where.slice("WHERE ".length) : "";

    const datatype = args.as.types[args.by];

    let next_i = next_index;
    const in_placeholders: string[] = [];
    const in_params: unknown[] = [];

    for (const v of args.join_values) {
      in_placeholders.push(`:${next_i++}`);
      in_params.push(await bind_value(datatype, v));
    }

    const in_part = `${quote(args.by)} IN (${in_placeholders.join(", ")})`;
    const WHERE = where_part
      ? `WHERE (${where_part}) AND (${in_part})`
      : `WHERE ${in_part}`;

    const all_columns = Object.keys(args.as.types);
    const fields = args.fields !== undefined && args.fields.length > 0
      ? args.fields
      : all_columns;
    const select_fields = [...new Set([...fields, args.by])];
    const SELECT = select_fields.map(quote).join(", ");

    const ORDER_BY = ` ORDER BY ${quote(args.by)} ASC${args.sort
      ? ", " + Object.entries(args.sort).map(([k, dir]) =>
        `${quote(k)} ${dir.toLowerCase() === "desc" ? "DESC" : "ASC"}`,
      ).join(", ")
      : ""}`;

    const table = quote(args.as.table);
    let q: string;

    if (per_parent !== undefined) {
      const rn_order = args.sort
        ? Object.entries(args.sort).map(([k, dir]) =>
          `${quote(k)} ${dir.toLowerCase() === "desc" ? "DESC" : "ASC"}`,
        ).join(", ")
        : "";

      q = `
        SELECT ${SELECT} FROM (
          SELECT ${SELECT},
            ROW_NUMBER() OVER (
              PARTITION BY ${quote(args.by)}
              ORDER BY ${quote(args.by)}${rn_order ? ", " + rn_order : ""}
            ) AS "__rn"
          FROM ${table}
          ${WHERE}
        )
        WHERE "__rn" <= ${per_parent}
        ${ORDER_BY}
      `;
    } else {
      q = `SELECT ${SELECT} FROM ${table} ${WHERE}${ORDER_BY}`;
    }

    const params = [...where_params, ...in_params];
    const rows = await this.#sql<Dict[]>(q, params);
    return rows.map(r => unbind(args.as.types, r));
  }

  read(as: As, args: { count: true; where: DataDict; with?: never }): Promise<number>;
  read(as: As, args: { where: DataDict; fields?: string[]; limit?: number; sort?: Sort; with?: With }): Promise<Dict[]>;
  async read(as: As, args: any): Promise<any> {
    assert.dict(args.where);
    this.#explain = {};

    if (args.count === true) return this.#count(as, args.where);

    if (base.withed(args)) {
      return sql.joinable(as, args.with)
        ? this.#read_joined(as, args)
        : this.#read_phased(as, args);
    }

    return this.#read(as, args);
  }

  async close() {
    await this.#connection?.close();
    this.#connection = undefined;
  }

  get explain() {
    return this.#explain;
  }

  get schema(): Schema {
    return {
      create: async (table, pk, types) => {
        const columns: string[] = [];
        for (const [key, value] of Object.entries(types)) {
          const column_type = get_column(value);
          const column = quote(key);
          if (key === pk.name) {
            const is_identity = pk.generate === true && column_type.startsWith("NUMBER");
            if (is_identity) {
              columns.push(`${column} ${column_type} GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY`);
            } else {
              columns.push(`${column} ${column_type} PRIMARY KEY`);
            }
          } else {
            columns.push(`${column} ${column_type}`);
          }
        }
        await this.#sql(
          `CREATE TABLE IF NOT EXISTS ${quote(table)} (${columns.join(", ")})`,
        );
      },

      delete: async table => {
        await this.#sql(
          `DROP TABLE IF EXISTS ${quote(table)} CASCADE CONSTRAINTS PURGE`,
        );
      },

      introspect: async (table /*, pk? */) => {
        const exists = await this.#sql<{ n: number }[]>(
          `
        SELECT COUNT(*) AS n
        FROM USER_TABLES
        WHERE TABLE_NAME = :1
        `,
          [table],
        );

        if (Number(exists[0]?.n ?? 0) === 0) return null;

        const rows = await this.#sql<IntrospectRow[]>(
          `
        SELECT
          COLUMN_NAME,
          DATA_TYPE,
          DATA_LENGTH,
          CHAR_LENGTH,
          DATA_PRECISION,
          DATA_SCALE
        FROM USER_TAB_COLUMNS
        WHERE TABLE_NAME = :1
        ORDER BY COLUMN_ID
        `,
          [table],
        );

        const result: Dict<DataKey[]> = {};
        for (const row of rows) {
          const candidates = oracle_columns_to_types(row);
          if (candidates.length > 0) {
            result[row.column_name] = candidates;
          }
        }
        return result;
      },

      alter: async (table, diff) => {
        const existing = await this.schema.introspect(table);
        if (existing === null) throw E.table_not_found(table);

        // rename first
        for (const [from, to] of diff.rename) {
          await this.#sql(
            `ALTER TABLE ${quote(table)} RENAME COLUMN ${quote(from)} TO ${quote(to)}`,
          );
        }

        // drop next
        for (const field of diff.drop) {
          await this.#sql(
            `ALTER TABLE ${quote(table)} DROP COLUMN ${quote(field)}`,
          );
        }

        // add last
        for (const [field, type] of Object.entries(diff.add)) {
          await this.#sql(
            `ALTER TABLE ${quote(table)} ADD (${quote(field)} ${get_column(type as DataKey)})`,
          );
        }
      },
    };
  }

  async create<O extends Dict>(as: As, record: Dict): Promise<O> {
    assert.dict(record);

    const pk = as.pk;
    const table = quote(as.table);

    // PK provided or none defined
    if (pk === null || pk in record) {
      const fields = Object.keys(record);
      if (fields.length === 0) {
        await this.#sql(`INSERT INTO ${table} VALUES (DEFAULT)`);
        return record as O;
      }
      const keys = fields.map(quote).join(", ");
      const values = fields.map((_, i) => `:${i + 1}`).join(", ");
      const params = await this.#create_params(as, record);
      await this.#sql(`INSERT INTO ${table} (${keys}) VALUES (${values})`, params);
      return record as O;
    }

    // PK missing
    if (as.generate_pk === false) throw E.pk_required(pk);

    const type = as.types[pk];

    // UUID — generate client-side
    if (base.is_uuid_type(type)) {
      const pk_value = base.generate_uuid(type);
      const to_insert = { ...record, [pk]: pk_value };
      const fields = Object.keys(to_insert);
      const keys = fields.map(quote).join(", ");
      const values = fields.map((_, i) => `:${i + 1}`).join(", ");
      const params = await this.#create_params(as, to_insert);
      await this.#sql(`INSERT INTO ${table} (${keys}) VALUES (${values})`, params);
      return to_insert as O;
    }

    // bigint — generate client-side via MAX
    if (base.BIGINT_STRING_TYPES.includes(type)) {
      const q = `SELECT MAX(${quote(pk)}) AS v FROM ${table}`;
      const rows = await this.#sql<{ v: string | null }[]>(q);
      const pk_value = rows[0]?.v !== null && rows[0]?.v !== undefined
        ? BigInt(rows[0].v) + 1n
        : 1n;
      const to_insert = { ...record, [pk]: pk_value };
      const fields = Object.keys(to_insert);
      const keys = fields.map(quote).join(", ");
      const values = fields.map((_, i) => `:${i + 1}`).join(", ");
      const params = await this.#create_params(as, to_insert);
      await this.#sql(`INSERT INTO ${table} (${keys}) VALUES (${values})`, params);
      return to_insert as O;
    }

    // integer — use GENERATED ALWAYS AS IDENTITY, get PK back via RETURNING INTO
    const fields = Object.keys(record);
    const keys = fields.length > 0 ? fields.map(quote).join(", ") : undefined;
    const values = fields.map((_, i) => `:${i + 1}`).join(", ");
    const params = await this.#create_params(as, record);

    const out_bind = { dir: oracledb.BIND_OUT, type: oracledb.NUMBER };
    const q = fields.length > 0
      ? `INSERT INTO ${table} (${keys}) VALUES (${values}) RETURNING ${quote(pk)} INTO :out`
      : `INSERT INTO ${table} VALUES (DEFAULT) RETURNING ${quote(pk)} INTO :out`;

    const conn = await this.#connect();
    const result = await conn.execute(q, [...params, out_bind], { autoCommit: true });
    const out = (result.outBinds as unknown[])[0];
    const pk_raw = Array.isArray(out) ? out[0] : out;
    return { ...record, [pk]: unbind_value(type, pk_raw) } as O;
  }

  #create_params(as: As, record: Dict) {
    return Promise.all(
      Object.keys(record).map(field => bind_value(as.types[field], record[field])),
    );
  }

  async update(as: As, args: { set: DataDict; where: DataDict }): Promise<number> {
    assert.nonempty(args.set);
    assert.dict(args.where);

    const set_keys = Object.keys(args.set);
    const set_parts: string[] = [];
    const set_params: unknown[] = [];
    let i = 1;

    for (const k of set_keys) {
      set_parts.push(`${quote(k)} = :${i++}`);
      set_params.push(await bind_value(as.types[k], args.set[k]));
    }

    const SET = `SET ${set_parts.join(", ")}`;
    const { WHERE, params } = await this.#where(as, args.where, i);

    const q = `UPDATE ${quote(as.table)} ${SET} ${WHERE}`;
    const conn = await this.#connect();
    const result = await conn.execute(q, [...set_params, ...params], {
      autoCommit: true,
    });
    return result.rowsAffected ?? 0;
  }

  async delete(as: As, args: { where: DataDict }): Promise<number> {
    assert.nonempty(args.where);

    const { WHERE, params } = await this.#where(as, args.where);
    const q = `DELETE FROM ${quote(as.table)} ${WHERE}`;
    const conn = await this.#connect();
    const result = await conn.execute(q, params, { autoCommit: true });
    return result.rowsAffected ?? 0;
  }
}
