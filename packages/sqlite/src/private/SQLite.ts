import typemap from "#typemap";
import type {
  As,
  DataDict, DB, PK, Sort, Types, With,
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

const schema = p({ database: p.string.default(":memory:") });

function like_to_glob(pattern: string) {
  return pattern
    .replace(/\\%/g, "<<PERCENT>>")
    .replace(/\\_/g, "<<UNDERSCORE>>")
    .replace(/\[/g, "<<LBRACKET>>")
    .replace(/\]/g, "<<RBRACKET>>")
    .replace(/\*/g, "[*]")
    .replace(/\?/g, "[?]")
    .replace(/%/g, "*")
    .replace(/_/g, "?")
    .replace(/<<PERCENT>>/g, "%")
    .replace(/<<UNDERSCORE>>/g, "_")
    .replace(/<<LBRACKET>>/g, "[[]")
    .replace(/<<RBRACKET>>/g, "[]]");
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

  if (sql.BIGINT_STRING_TYPES.includes(datatype)) {
    const cmp = sql.UNSIGNED_BIGINT_TYPES.includes(datatype)
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

function bind_value(key: DataKey, value: unknown) {
  return value === null ? null : typemap[key].bind(value as never);
}

function unbind_value(key: DataKey, value: unknown) {
  return typemap[key].unbind(value as never);
}

async function bind(types: Types, fields: DataDict) {
  const out: Binds = {};

  for (const [key, value] of Object.entries(fields)) {
    if (is.dict(value)) throw E.operator_scalar(key);

    const raw = key.startsWith("s_") ? key.slice(2) : key;
    const base = raw.split("__")[0];

    out[`${BIND_BY}${key}`] = await bind_value(types[base], value);
  }

  return out;
}

function unbind(types: Types, row: Dict) {
  return sql.unbind<ReturnType<typeof unbind_value>>(types, row, unbind_value);
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
      create: (name: string, store: StoreSchema, pk: PK, pk_generate: boolean) => {
        const columns: string[] = [];

        for (const [key, value] of Object.entries(store)) {
          const column_type = get_column(value.datatype);
          const column = `${sql.quote(key)} ${column_type}`;
          const is_integer = column_type === "INTEGER";
          if (key === pk) {
            const generate = pk_generate && is_integer ? " AUTOINCREMENT" : "";
            columns.push(`${column} PRIMARY KEY${generate}`);
          } else {
            columns.push(column);
          }
        }

        this.#sql(`CREATE TABLE IF NOT EXISTS
          ${sql.quote(name)} (${columns.join(", ")})`).run();
      },
      delete: (name: string) => {
        this.#sql(`DROP TABLE IF EXISTS ${sql.quote(name)}`).run();
      },
    };
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

  #generate_pk(as: As) {
    const pk = as.pk!;
    const type = as.types[pk];

    if (type === "string") return crypto.randomUUID();

    if (sql.BIGINT_STRING_TYPES.includes(type)) {
      const col = sql.quote(pk);
      const table = sql.quote(as.name);
      const query = `SELECT ${col} AS v
        FROM ${table} ORDER BY LENGTH(${col}) DESC, ${col} DESC LIMIT 1`;
      const rows = this.#sql(query).all() as { v: string | null }[];
      return rows[0]?.v ? BigInt(rows[0].v) + 1n : 1n;
    }

    throw "unreachable";
  }

  async create<O extends Dict>(as: As, record: Dict): Promise<O> {
    assert.dict(record);

    const pk = as.pk;
    const data = record as DataDict;
    const keys = Object.keys(data);
    const table = sql.quote(as.name);

    // PK provided or none defined, simple insert
    if (pk === null || pk in record) {
      const query = keys.length > 0
        ? `INSERT INTO ${table} (${keys.map(sql.quote).join(", ")})
         VALUES (${keys.map(k => `${BIND_BY}${k}`).join(", ")})`
        : `INSERT INTO ${table} DEFAULT VALUES`;
      this.#sql(query).run(await bind(as.types, data));
      return record as O;
    }

    if (as.generate_pk === false) throw E.pk_required(pk);

    const type = as.types[pk];

    // integer types, use RETURNING
    if (!sql.BIGINT_STRING_TYPES.includes(type) && type !== "string") {
      const query = keys.length > 0
        ? `INSERT INTO ${table} (${keys.map(sql.quote).join(", ")})
         VALUES (${keys.map(k => `${BIND_BY}${k}`).join(", ")})
         RETURNING ${sql.quote(pk)}`
        : `INSERT INTO ${table} DEFAULT VALUES RETURNING ${sql.quote(pk)}`;
      const rows = this.#sql(query).all(await bind(as.types, data)) as Dict[];
      const pk_value = unbind_value(type, rows[0][pk]);
      return { ...record, [pk]: pk_value } as O;
    }

    // string or bigint, generate manually
    const pk_value = this.#generate_pk(as);
    const to_insert = { ...record, [pk]: pk_value } as DataDict;
    const insert_keys = Object.keys(to_insert);
    const query = `INSERT INTO ${table} (${insert_keys.map(sql.quote).join(", ")})
      VALUES (${insert_keys.map(k => `${BIND_BY}${k}`).join(", ")})`;
    this.#sql(query).run(await bind(as.types, to_insert));
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

    if (sql.withed(args)) {
      return sql.joinable(as, args.with)
        ? this.#read_joined(as, args)
        : this.#read_phased(as, args);
    }

    return this.#read_base(as, args);
  }

  async #count(as: As, where: DataDict) {
    const WHERE = this.#where(as.types, where);
    const binds = await this.#bind_where(as.types, where);
    const query = `SELECT COUNT(*) AS n FROM ${sql.table(as)} ${WHERE}`;

    this.#capture(as.name, query, binds);

    const rows = this.#sql(query).all(binds) as { n: bigint }[];

    assert.true(rows.length === 1,
      `COUNT(*) must return 1 row (got ${rows.length})`);

    const n = rows[0].n;
    assert.bigint(n, `COUNT returned non-bigint: ${typeof n}`);

    if (n > BigInt(Number.MAX_SAFE_INTEGER)) throw E.count_overflow(as.name, n);

    return Number(n);
  }

  async #read_base(as: As, args: ReadArgs) {
    const query = this.#base_query(as, args);
    const binds = await this.#bind_where(as.types, args.where);
    return this.#query_all(as, query, binds);
  }

  async #read_phased(as: As, args: ReadRelationsArgs) {
    const fields = sql.expandFields(as, args.fields, args.with);
    const rows = await this.#read_base(as, { ...args, fields });
    const out = rows.map(row => sql.project(row, args.fields));

    for (const [table, relation] of Object.entries(args.with)) {
      await this.#attach_relation(as, { rows, out, table, relation });
    }

    return out;
  }

  async #attach_relation(as: As,
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
        ? rows.map(r => sql.project(r, relation.fields))
        : rows[0] ? sql.project(rows[0], relation.fields) : null;
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
    for (let i = 0; i < args.join_values.length; i++) {
      const key = `${args.by}__in${i}`;
      in_binds[key] = args.join_values[i] as DataDict[string];
      placeholders.push(`${BIND_BY}${key}`);
    }
    const where = this.#where(args.as.types, args.where);
    const where_part = where ? where.slice("WHERE ".length) : "";
    const in_part = `${sql.quote(args.by)} IN (${placeholders.join(", ")})`;

    const where_parts = where_part
      ? [`(${where_part})`, `(${in_part})`]
      : [in_part];
    const WHERE = `WHERE ${where_parts.join(" AND ")}`;

    const all_columns = Object.keys(args.as.types);
    const fields = args.fields !== undefined && args.fields.length > 0
      ? args.fields
      : all_columns;
    const SELECT = sql.selectList(args.as.types, sql.fields(fields, args.by));

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

  #join(as: As, aliases: Dict<string>, relation: NonNullable<With[string]>) {
    const parent_alias = aliases[as.name];
    const alias = aliases[relation.as.name];
    const table = sql.table(relation.as);

    const by = relation.reverse ? relation.as.pk : relation.fk;
    const parent_by = relation.reverse ? relation.fk : as.pk;

    if (by === null) throw E.relation_requires_pk("target");
    if (parent_by === null) throw E.relation_requires_pk("parent");

    const left = `${alias}.${sql.quote(by)}`;
    const right = `${parent_alias}.${sql.quote(parent_by)}`;

    return `LEFT JOIN ${table} ${alias} ON ${left} = ${right}`;
  }

  #nest(as: As,
    args: { rows: Dict[]; aliases: Dict<string> },
    relation_args: ReadRelationsArgs): Dict[] {
    if (as.pk === null) throw E.relation_requires_pk("parent");

    const base_alias = args.aliases[as.name];
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
          if (v === null || v === undefined) continue;
          parent[f] = unbind_value(as.types[f], v);
        }
        for (const [name, relation] of relation_entries) {
          parent[name] = relation.kind === "many" ? [] : null;
        }
        grouped.set(pk_value, parent);
      }

      const parent = grouped.get(pk_value) ?? {};

      for (const [name, relation] of relation_entries) {
        const alias = args.aliases[relation.as.name];
        const pk = relation.as.pk;
        if (pk === null) continue;

        const pk_key = `${alias}_${pk}`;
        if (base_row[pk_key] == null) continue;

        const fields = relation.fields ?? Object.keys(relation.as.types);
        const row: Dict = {};
        for (const field of fields) {
          const v = base_row[`${alias}_${field}`];
          if (v === null || v === undefined) continue;
          row[field] = unbind_value(relation.as.types[field], v);
        }

        if (relation.kind === "many") {
          (parent[name] as Dict[]).push(row);
        } else if (parent[name] === null) {
          parent[name] = row;
        }
      }
    }

    return [...grouped.values()];
  }

  #base_query(as: As, args: {
    fields?: string[];
    where: DataDict;
    sort?: Sort;
    limit?: number;
  }) {
    const SELECT = sql.selectList(as.types, args.fields);
    const WHERE = this.#where(as.types, args.where);
    const ORDER_BY = sql.orderBy(as.types, args.sort);
    const LIMIT = sql.limit(args.limit);
    return `SELECT ${SELECT} FROM ${sql.table(as)} ${WHERE}${ORDER_BY}${LIMIT}`;
  }

  async #read_joined(as: As, args: ReadRelationsArgs): Promise<Dict[]> {
    if (as.pk === null) throw E.relation_requires_pk("parent");

    const tables = [as.name, ...Object.values(args.with).map(r => r.as.name)];
    const aliases = sql.aliases(tables);
    const alias = aliases[as.name];
    const fields = sql.fields(args.fields, as.pk);

    // subquery for limited parents
    const SELECT = [
      sql.select(aliases, as, fields),
      ...Object.values(args.with).map(relation => {
        return sql.select(aliases, relation.as, relation.as.pk !== null
          ? sql.fields(relation.fields, relation.as.pk)
          : relation.fields);

      }),
    ].join(", ");
    const SUBQUERY = `(${this.#base_query(as, { ...args, fields })})`;
    const FROM = `${SUBQUERY} ${alias}`;
    const JOINS = Object.values(args.with)
      .map(relation => this.#join(as, aliases, relation))
      .join("\n");
    const ORDER_BY = sql.orderBy(as.types, args.sort, alias);

    const query = `SELECT ${SELECT} FROM ${FROM} ${JOINS} ${ORDER_BY}`;
    const binds = await this.#bind_where(as.types, args.where);
    const rows = this.#sql(query).all(binds) as Dict[];

    this.#capture(as.name, query, binds);

    return this.#nest(as, { rows, aliases }, args);
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

  close() {
    this.#db.close();
  }
}
