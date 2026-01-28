import typemap from "#typemap";
import type {
  As, AsPK, DataDict, PK, Sort, TypeMap, Types, With,
} from "@primate/core/db";
import DB from "@primate/core/db/DB";
import E from "@primate/core/db/error";
import assert from "@rcompat/assert";
import is from "@rcompat/is";
import type { Param } from "@rcompat/sqlite";
import Client from "@rcompat/sqlite";
import type { Dict } from "@rcompat/type";
import type { StoreSchema } from "pema";
import p from "pema";

type Binds = Param | undefined;

type CMP_OPERATOR = ">" | ">=" | "<" | "<=";

interface ReadArgs {
  where: DataDict;
  fields?: string[];
  sort?: Sort;
  limit?: number;
}

interface ReadRelationsArgs extends ReadArgs {
  with: With;
}

function has_with(args: ReadArgs & { with?: With }): args is ReadRelationsArgs {
  return args.with !== undefined;
}

const schema = p({
  database: p.string.default(":memory:"),
});

const UNSIGNED_BIGINT_TYPES = ["u64", "u128"];
const SIGNED_BIGINT_TYPES = ["i128"];
const BIGINT_STRING_TYPES = [...UNSIGNED_BIGINT_TYPES, ...SIGNED_BIGINT_TYPES];
const SQL_OPS: Dict<">" | ">=" | "<" | "<="> = {
  $gt: ">", $after: ">",
  $gte: ">=",
  $lt: "<", $before: "<",
  $lte: "<=",
};

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

function project(row: Dict, fields?: readonly string[]) {
  if (fields === undefined || fields.length === 0) return { ...row };
  const out: Dict = {};
  for (const k of fields) if (k in row) out[k] = row[k];
  return out;
}

function bind_key(column: string, op: string): string {
  const suffix = op.startsWith("$") ? op.slice(1) : op;
  return `${column}__${suffix}`;
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
  const rhs = `$${key}`;
  const sql_op = SQL_OPS[op];
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
  const rhs = `$${key}`;

  if (case_insensitive) return `LOWER(${field}) LIKE LOWER(${rhs})`;

  return `CAST(${field} AS TEXT) GLOB ${rhs}`;
}

export default class SQLite extends DB {
  #factory: () => Client;
  #client?: Client;
  #debug = false;
  #explain: Dict<{ query: string; plan: string[] }> = {};

  static config: typeof schema.input;

  constructor(config?: typeof schema.input, options?: { debug?: boolean }) {
    super("$");
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

  #$sql(query: string) {
    return this.#db.prepare(`EXPLAIN QUERY PLAN ${query}`);
  }

  #capture(name: string, query: string, binds: Binds) {
    if (!this.#debug) return;
    const rows = this.#$sql(query).all(binds) as { detail: string }[];
    this.#explain[name] = {
      query,
      plan: rows.map(r => r.detail),
    };
  }

  get explain() {
    return this.#explain;
  }

  get typemap() {
    return typemap as unknown as TypeMap<Dict>;
  }

  get schema() {
    return {
      create: (name: string, store: StoreSchema, pk: PK) => {
        const types: Types = {};
        const columns: string[] = [];

        for (const [key, value] of Object.entries(store)) {
          types[key] = value.datatype;
          const column = `${this.quote(key)} ${this.column(value.datatype)}`;
          columns.push(key === pk ? `${column} PRIMARY KEY` : column);
        }

        this.#sql(`CREATE TABLE IF NOT EXISTS
          ${this.quote(name)} (${columns.join(", ")})`).run();
      },
      delete: (name: string) => {
        this.#sql(`DROP TABLE IF EXISTS ${this.quote(name)}`).run();
      },
    };
  }

  close() {
    this.#db.close();
  }

  toWhere(types: Types, where: DataDict, alias?: string) {
    const fields = Object.keys(where);
    if (fields.length === 0) return "";

    const parts: string[] = [];

    for (const field of fields) {
      const value = where[field];
      const datatype = types[field];
      const q = this.quote(field);
      const quoted = alias ? `${alias}.${q}` : q;

      if (value === null) {
        parts.push(`${quoted} IS NULL`);
        continue;
      }

      if (is.dict(value)) {
        const ops = Object.entries(value);
        if (ops.length === 0) throw E.operator_empty(field);

        for (const [op] of ops) {
          const bound_key = bind_key(field, op);

          switch (op) {
            case "$like":
              parts.push(like(quoted, bound_key, false));
              break;
            case "$ilike":
              parts.push(like(quoted, bound_key, true));
              break;
            case "$ne":
              parts.push(`${quoted} != $${bound_key}`);
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

      parts.push(`${quoted}=$${field}`);
    }

    return `WHERE ${parts.join(" AND ")}`;
  }

  async bindWhere(types: Types, where: DataDict): Promise<Dict> {
    const filtered: DataDict = {};

    for (const [field, value] of Object.entries(where)) {
      if (value === null) continue;

      if (is.dict(value)) {
        const ops = Object.entries(value);

        for (const [op, op_value] of ops) {
          const bound_key = bind_key(field, op);

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

    return this.bind(types, filtered);
  }

  async create<O extends Dict>(as: As, args: { record: Dict }): Promise<O> {
    assert.dict(args.record);

    const record = args.record as DataDict;
    const keys = Object.keys(record);

    const query = keys.length > 0
      ? `INSERT INTO ${this.table(as)} (
          ${keys.map(k => this.quote(k)).join(", ")})
          VALUES (${keys.map(k => `$${k}`).join(", ")})`
      : `INSERT INTO ${this.table(as)} DEFAULT VALUES`;

    this.#sql(query).run(await this.bind(as.types, record) as Binds);

    return args.record as O;
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

    if (args.count === true) {
      if (args.with) throw E.count_with_incompatible();
      return this.#count(as, args.where);
    }

    if (has_with(args)) {
      return this.#use_join(args.with)
        ? this.#read_with_joins(as, args)
        : this.#read_phased(as, args);
    }

    return this.#read_base(as, args);
  }

  #use_join(relations: With): boolean {
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

  async #count(as: As, where: DataDict) {
    const WHERE = this.toWhere(as.types, where);
    const binds = await this.bindWhere(as.types, where) as Binds;
    const query = `SELECT COUNT(*) AS n FROM ${this.table(as)} ${WHERE}`;
    const [{ n }] = this.#sql(query).all(binds);
    this.#capture(as.name, query, binds);
    return Number(n);
  }

  async #read_base(as: As, args: ReadArgs): Promise<Dict[]> {
    const select = this.toSelect(as.types, args.fields);
    const where = this.toWhere(as.types, args.where);
    const order = this.toSort(as.types, args.sort);
    const lim = this.toLimit(args.limit);
    const binds = await this.bindWhere(as.types, args.where) as Binds;
    const query = `SELECT ${select} FROM ${this.table(as)} ${where}${order}${lim}`;
    const rows = this.#sql(query).all(binds) as Dict[];

    this.#capture(as.name, query, binds);

    return rows.map(r => this.unbind(as.types, r));
  }

  async #read_phased(as: As, args: ReadRelationsArgs) {
    const fields = this.#expand_fields(as, args.fields, args.with);
    const base_rows = await this.#read_base(as, { ...args, fields });
    const out: Dict[] = base_rows.map(row => project(row, args.fields));

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
    rel: NonNullable<With[string]>,
  ) {
    const { as: target_as, kind, fk, reverse, where, fields, sort, limit } = rel;

    const target_join_col = reverse ? target_as.pk : fk;
    if (target_join_col === null) throw E.relation_requires_pk("target");

    const parent_join_col = reverse ? fk : as.pk;
    if (parent_join_col === null) throw E.relation_requires_pk("parent");

    const join_values = [...new Set(
      base_rows.map(r => r[parent_join_col]).filter(v => v != null),
    )];

    if (join_values.length === 0) {
      const empty = kind === "many" ? [] : null;
      for (const row of out) row[name] = empty;
      return;
    }

    const related = await this.#load_related(
      target_as, target_join_col, join_values, where, fields, sort, kind, limit,
    );

    const grouped = new Map<unknown, Dict[]>();
    for (const row of related) {
      const key = row[target_join_col];
      if (key == null) continue;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(row);
    }

    for (let i = 0; i < out.length; i++) {
      const join_value = base_rows[i][parent_join_col];

      if (join_value == null) {
        out[i][name] = kind === "many" ? [] : null;
        continue;
      }

      const rows = grouped.get(join_value) ?? [];
      out[i][name] = kind === "many"
        ? rows.map(r => project(r, fields))
        : (rows[0] ? project(rows[0], fields) : null);
    }
  }

  async #load_related(
    as: As,
    by: string,
    join_values: unknown[],
    where: DataDict,
    fields?: string[],
    sort?: Sort,
    kind?: "one" | "many",
    limit?: number,
  ) {
    const per_parent = kind === "one" ? 1 : limit;

    const in_binds: DataDict = {};
    const placeholders: string[] = [];
    join_values.forEach((v, i) => {
      const key = `${by}__in${i}`;
      in_binds[key] = v as DataDict[string];
      placeholders.push(`$${key}`);
    });

    const crit_where = this.toWhere(as.types, where);
    const crit_part = crit_where ? crit_where.slice("WHERE ".length) : "";
    const in_part = `${this.quote(by)} IN (${placeholders.join(", ")})`;

    const where_parts = crit_part ? [`(${crit_part})`, `(${in_part})`] : [in_part];
    const WHERE = `WHERE ${where_parts.join(" AND ")}`;

    const all_cols = Object.keys(as.types);
    const base_fields = fields && fields.length > 0 ? fields : all_cols;
    const select_fields = [...new Set([...base_fields, by])];
    const select = this.toSelect(as.types, select_fields);

    const base_order = `${this.quote(by)} ASC`;
    const user_order = this.toSort(as.types, sort).replace(/^ ORDER BY /, "");
    const ORDER_BY = user_order
      ? ` ORDER BY ${base_order}, ${user_order}`
      : ` ORDER BY ${base_order}`;

    const crit_binds = await this.bindWhere(as.types, where);
    const in_binds_bound = await this.bind(as.types, in_binds);

    let query: string;
    let binds: Binds;

    if (per_parent !== undefined) {
      const per_key = `${by}__limit__per_parent`;

      query = `
        WITH ranked AS (
          SELECT
            ${select},
            ROW_NUMBER() OVER (
              PARTITION BY ${this.quote(by)}
              ${user_order ? `ORDER BY ${user_order}` : ""}
            ) AS __rn
          FROM ${this.table(as)}
          ${WHERE}
        )
        SELECT ${select}
        FROM ranked
        WHERE __rn <= $${per_key}
        ${ORDER_BY}
      `;

      binds = {
        ...(crit_binds as Dict),
        ...(in_binds_bound as Dict),
        [per_key]: per_parent,
      } as Binds;
    } else {
      query = `SELECT ${select} FROM ${this.table(as)} ${WHERE}${ORDER_BY}`;
      binds = { ...(crit_binds as Dict), ...(in_binds_bound as Dict) } as Binds;
    }

    const rows = this.#sql(query).all(binds) as Dict[];

    this.#capture(as.name, query, binds);

    return rows.map(r => this.unbind(as.types, r));
  }

  // --- Join strategy (single query) ---

  #join(aliases: Dict<string>, parent_as: As, rel: NonNullable<With[string]>) {
    const parent_alias = aliases[parent_as.name];
    const rel_alias = aliases[rel.as.name];
    const table = this.table(rel.as);

    const join_col = rel.reverse ? rel.as.pk : rel.fk;
    const parent_col = rel.reverse ? rel.fk : parent_as.pk;

    if (join_col === null) throw E.relation_requires_pk("target");
    if (parent_col === null) throw E.relation_requires_pk("parent");

    const lhs = `${rel_alias}.${this.quote(join_col)}`;
    const rhs = `${parent_alias}.${this.quote(parent_col)}`;

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

  async #read_with_joins(as: As, args: ReadRelationsArgs): Promise<Dict[]> {
    const { where, fields, sort, limit, with: _with } = args;

    if (as.pk === null) throw E.relation_requires_pk("parent");

    const tables = [as.name, ...Object.values(_with).map(r => r.as.name)];
    const aliases = this.aliases(tables);
    const alias = aliases[as.name];

    const base_fields = fields ? [...new Set([...fields, as.pk])] : undefined;

    const SELECT = [
      this.select(aliases, as, base_fields),
      ...Object.values(_with).map(r => {
        const rel_fields = r.fields && r.as.pk
          ? [...new Set([...r.fields, r.as.pk])]
          : r.fields;
        return this.select(aliases, r.as, rel_fields);
      }),
    ].join(", ");

    const from = `${this.table(as)} ${alias}`;
    const joins = Object.values(_with)
      .map(rel => this.#join(aliases, as, rel))
      .join("\n");

    const WHERE = this.toWhere(as.types, where, alias);
    const ORDER = this.toSort(as.types, sort, alias);
    const LIMIT = limit !== undefined ? ` LIMIT ${limit}` : "";

    const binds = await this.bindWhere(as.types, where) as Binds;
    const query = `SELECT ${SELECT} FROM ${from}\n${joins}\n${WHERE}${ORDER}${LIMIT}`;

    const rows = this.#sql(query).all(binds) as Dict[];

    this.#capture(as.name, query, binds);

    return this.#nest(rows, aliases, as, fields, _with);
  }

  async update(as: As, args: { set: DataDict; where: DataDict }) {
    assert.nonempty(args.set);
    assert.dict(args.where);

    const WHERE = this.toWhere(as.types, args.where);
    const { set, binds: set_binds } = await this.toSet(as.types, args.set);
    const crit_binds = await this.bindWhere(as.types, args.where);
    const binds = { ...crit_binds, ...set_binds } as Binds;

    const query = `UPDATE ${this.table(as)} ${set} ${WHERE}`;
    return Number(this.#sql(query).run(binds).changes);
  }

  async delete(as: As, args: { where: DataDict }) {
    assert.nonempty(args.where);

    const WHERE = this.toWhere(as.types, args.where);
    const binds = await this.bindWhere(as.types, args.where) as Binds;

    const query = `DELETE FROM ${this.table(as)} ${WHERE}`;
    return Number(this.#sql(query).run(binds).changes);
  }

  async lastId(as: AsPK) {
    assert.defined(as.types[as.pk]);

    const datatype = as.types[as.pk];

    if (datatype === "string") return 0;

    const pk = this.quote(as.pk);
    const tbl = this.quote(as.name);
    const base = `SELECT ${pk} AS v FROM ${tbl}`;

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
