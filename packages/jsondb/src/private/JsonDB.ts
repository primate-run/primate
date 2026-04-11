import type { As, DataDict, DB, Schema, Sort, Types, With } from "@primate/core/db";
import E from "@primate/core/db/errors";
import assert from "@rcompat/assert";
import type { FileRef } from "@rcompat/fs";
import fs from "@rcompat/fs";
import is from "@rcompat/is";
import type { Dict, PartialDict } from "@rcompat/type";
import p from "pema";

type Tables = PartialDict<Dict[]>;

function escape_re(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function comparable(x: unknown) {
  if (is.date(x)) return x.getTime();
  if (is.url(x)) return x.href;
  return x as any;
}

function like_re(pattern: string, flags = "") {
  return new RegExp(
    "^" +
    escape_re(pattern)
      .replace(/\\%/g, "<<PERCENT>>")
      .replace(/\\_/g, "<<UNDERSCORE>>")
      .replace(/%/g, "[\\s\\S]*")
      .replace(/_/g, "[\\s\\S]")
      .replace(/<<PERCENT>>/g, "%")
      .replace(/<<UNDERSCORE>>/g, "_") +
    "$",
    flags,
  );
}

function match(record: Dict, where: Dict) {
  return Object.entries(where).every(([k, v]) => {
    const value = record[k];

    if (v === null) return value === null || value === undefined;

    if (is.dict(v)) {
      if (value === null || value === undefined) return false;

      for (const [op, op_val] of Object.entries(v)) {
        switch (op) {
          case "$like": {
            if (!is.string(value)) return false;
            if (!like_re(op_val as string).test(value)) return false;
            break;
          }

          case "$ilike": {
            if (!is.string(value)) return false;
            if (!like_re(op_val as string, "i").test(value)) return false;
            break;
          }

          case "$gte":
            if (!(comparable(value) >= comparable(op_val))) return false;
            break;

          case "$gt":
          case "$after":
            if (!(comparable(value) > comparable(op_val))) return false;
            break;

          case "$lte":
            if (!(comparable(value) <= comparable(op_val))) return false;
            break;

          case "$lt":
          case "$before":
            if (!(comparable(value) < comparable(op_val))) return false;
            break;

          case "$ne": {
            if (is.date(value) && is.date(op_val)) {
              if (value.getTime() === op_val.getTime()) return false;
              break;
            }
            if (is.url(value) && is.url(op_val)) {
              if (value.href === op_val.href) return false;
              break;
            }
            if (value === op_val) return false;
            break;
          }

          default:
            throw E.operator_unknown(k, op);
        }
      }

      return true;
    }

    if (is.date(value) && is.date(v)) return value.getTime() === v.getTime();
    if (is.url(value) && is.url(v)) return value.href === v.href;

    return value === v;
  });
}

function filter(record: Dict, fields: string[]) {
  return Object.fromEntries(
    Object.entries(record).filter(([key]) => fields.includes(key)),
  );
}

function to_sorted<T extends Dict>(d1: T, d2: T, sort: Sort) {
  return Object.entries(sort)
    .map(([k, value]) => [k, value === "asc" ? 1 : -1] as const)
    .reduce((sorting, [field, direction]) => {
      const left = d1[field] as T[keyof T];
      const right = d2[field] as typeof left;
      if (sorting !== 0) return sorting;
      if (left === right) return sorting;
      if (left < right) return -1 * direction;
      return direction;
    }, 0);
}

// JSON serialization for types that JSON can't represent natively

async function prepare_for_json(rows: Dict[]): Promise<unknown[]> {
  return Promise.all(rows.map(async row => {
    const out: Dict = {};
    for (const [key, value] of Object.entries(row)) {
      if (typeof value === "bigint") {
        out[key] = { __type: "bigint", value: String(value) };
      } else if (value instanceof Blob) {
        const bytes = new Uint8Array(await value.arrayBuffer());
        let binary = "";
        for (const byte of bytes) binary += String.fromCharCode(byte);
        out[key] = { __type: "blob", value: btoa(binary) };
      } else if (is.date(value)) {
        out[key] = { __type: "datetime", value: value.toISOString() };
      } else if (is.url(value)) {
        out[key] = { __type: "url", value: value.href };
      } else {
        out[key] = value;
      }
    }
    return out;
  }));
}

function revive_from_json(rows: unknown[]): Dict[] {
  return (rows as Dict[]).map(row => {
    const out: Dict = {};
    for (const [key, value] of Object.entries(row)) {
      if (is.dict(value) && "__type" in value && "value" in value) {
        switch (value.__type) {
          case "bigint":
            out[key] = BigInt(value.value as string);
            break;
          case "blob": {
            const binary = atob(value.value as string);
            const bytes = Uint8Array.from(
              { length: binary.length },
              (_, i) => binary.charCodeAt(i),
            );
            out[key] = new Blob([bytes], { type: "application/octet-stream" });
            break;
          }
          case "datetime":
            out[key] = new Date(value.value as string);
            break;
          case "url":
            out[key] = new URL(value.value as string);
            break;
          default:
            out[key] = value;
        }
      } else {
        out[key] = value;
      }
    }
    return out;
  });
}

const config_schema = p({
  directory: p.string.default("data"),
});

export default class JSONDB implements DB<Tables> {
  static config: typeof config_schema.input;
  #directory: FileRef;
  #tables: Tables = {};
  #types: PartialDict<Types> = {};

  constructor(config?: typeof config_schema.input) {
    const parsed = config_schema.parse(config);
    this.#directory = fs.ref(parsed.directory);
  }

  get client() {
    return this.#tables;
  }

  #ref(table: string): FileRef {
    return this.#directory.join(`${table}.json`);
  }

  async #load(table: string): Promise<void> {
    if (this.#tables[table] !== undefined) return;

    const ref = this.#ref(table);
    if (await ref.exists()) {
      const text = await ref.text();
      const raw = JSON.parse(text) as unknown[];
      this.#tables[table] = revive_from_json(raw);
    } else {
      this.#tables[table] = [];
    }
  }

  async #persist(table: string): Promise<void> {
    const rows = this.#use(table);
    const prepared = await prepare_for_json(rows);
    const text = JSON.stringify(prepared, null, 2);

    if (!await this.#directory.exists()) {
      await this.#directory.create();
    }

    await this.#ref(table).write(text);
  }

  #use(table: string): Dict[] {
    this.#tables[table] ??= [];
    return this.#tables[table];
  }

  get schema(): Schema {
    return {
      create: async (table, _pk, types) => {
        await this.#load(table);
        this.#types[table] = types;
      },
      delete: async (table) => {
        delete this.#tables[table];
        delete this.#types[table];
        const ref = this.#ref(table);
        if (await ref.exists()) {
          await ref.remove();
        }
      },
      introspect: (table) => {
        if (this.#tables[table] === undefined) return null;
        const types = this.#types[table] ?? {};
        return Object.fromEntries(
          Object.entries(types).map(([field, type]) => [field, [type]]),
        );
      },
      alter: (table, diff) => {
        if (this.#types[table] === undefined) throw E.table_not_found(table);

        const types = { ...this.#types[table] };
        const { add, drop, rename } = diff;

        for (const [field, type] of Object.entries(add)) types[field] = type;
        for (const field of drop) delete types[field];
        for (const [from, to] of rename) {
          types[to] = types[from];
          delete types[from];
        }

        this.#types[table] = types;
      },
    };
  }

  close() { }

  #next_id(as: As) {
    const table = this.#use(as.table);
    const size = table.length;
    const pk = assert.defined(as.pk);
    const type = as.types[pk];

    if (type === "uuid" || type === "uuid_v4" || type === "uuid_v7") {
      return crypto.randomUUID();
    } else if (["u64", "u128", "i64", "i128"].includes(type)) {
      return size === 0 ? 0n : (table[size - 1][pk] as bigint) + 1n;
    } else {
      return size === 0 ? 0 : (table[size - 1][pk] as number) + 1;
    }
  }

  async create<O extends Dict>(as: As, record: Dict): Promise<O> {
    assert.nonempty(record);

    await this.#load(as.table);
    const table = this.#use(as.table);
    const pk = as.pk;

    let to_insert = record;

    if (pk !== null && !(pk in record)) {
      if (as.generate_pk === false) throw E.pk_required(pk);
      to_insert = { ...record, [pk]: this.#next_id(as) };
    }

    if (pk !== null) {
      const pv = to_insert[pk];
      if (table.find(s => s[pk] === pv) !== undefined) {
        throw E.pk_duplicate(pk);
      }
    }

    table.push({ ...to_insert });
    await this.#persist(as.table);

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
  }): Promise<Dict[] | number> {
    assert.dict(args.where);

    await this.#load(as.table);
    const table = this.#use(as.table);
    const matches = table.filter(r => match(r, args.where));

    if (args.count === true) return matches.length;

    const sort = args.sort ?? {};
    const sorted = Object.keys(sort).length === 0
      ? matches
      : matches.toSorted((a, b) => to_sorted(a, b, sort));

    const limit = args.limit ?? sorted.length;
    const base_rows = sorted.slice(0, limit);

    if (args.with === undefined) {
      const fields = args.fields ?? [];
      return fields.length === 0
        ? base_rows
        : base_rows.map(r => filter(r, fields));
    }

    assert.dict(args.with);

    const base_fields = args.fields ?? [];
    const out = base_rows.map(full =>
      base_fields.length === 0 ? { ...full } : filter(full, base_fields),
    );
    const base_full = base_rows;

    for (const [r_name, rel] of Object.entries(args.with)) {
      const target_as = rel.as;
      const kind = rel.kind;
      const fk = rel.fk;
      const reverse = rel.reverse === true;
      const r_where = rel.where;
      const r_sort = rel.sort;
      const r_limit = rel.limit;
      const r_fields = rel.fields ?? [];

      await this.#load(target_as.table);
      const target = this.#use(target_as.table);

      function project_rel(row: Dict) {
        if (r_fields.length === 0) return { ...row };
        return filter(row, r_fields);
      }

      if (kind === "one" && reverse) {
        const target_pk = target_as.pk;
        if (target_pk === null) throw E.relation_requires_pk("target");

        for (let i = 0; i < out.length; i++) {
          const parent_full = base_full[i];
          const fk_value = parent_full[fk];

          if (fk_value == null) {
            out[i][r_name] = null;
            continue;
          }

          let candidates = target.filter(
            t => t[target_pk] === fk_value && match(t, r_where),
          );

          if (r_sort !== undefined && Object.keys(r_sort).length > 0) {
            candidates = candidates.toSorted((a, b) =>
              to_sorted(a, b, r_sort),
            );
          }

          if (r_limit !== undefined) candidates = candidates.slice(0, r_limit);

          const got = candidates[0];
          out[i][r_name] = got ? project_rel(got) : null;
        }

        continue;
      }

      const parent_pk = as.pk;
      if (parent_pk === null) throw E.relation_requires_pk("parent");

      const parent_keys = new Set(base_full.map(r => r[parent_pk]));
      const grouped = new Map<unknown, Dict[]>();

      for (const row of target) {
        const key = row[fk];
        if (!parent_keys.has(key)) continue;
        if (!match(row, r_where)) continue;

        const bucket = grouped.get(key);
        if (bucket !== undefined) bucket.push(row);
        else grouped.set(key, [row]);
      }

      for (let i = 0; i < out.length; i++) {
        const parent_full = base_full[i];
        const key = parent_full[parent_pk];

        let rows = grouped.get(key) ?? [];

        if (r_sort !== undefined && Object.keys(r_sort).length > 0) {
          rows = rows.toSorted((a, b) => to_sorted(a, b, r_sort));
        }

        if (kind === "one") {
          if (r_limit !== undefined) rows = rows.slice(0, r_limit);
          const got = rows[0];
          out[i][r_name] = got ? project_rel(got) : null;
        } else {
          if (r_limit !== undefined) rows = rows.slice(0, r_limit);
          out[i][r_name] = rows.map(project_rel);
        }
      }
    }

    return out;
  }

  async update(as: As, args: { set: DataDict; where: DataDict }) {
    assert.nonempty(args.set);
    assert.dict(args.where);

    await this.#load(as.table);
    const table = this.#use(as.table);
    const matched = table.filter(record => match(record, args.where));
    const pk = as.pk;

    const count = matched.map(record => {
      const merged = { ...record, ...args.set };
      const changed = Object.fromEntries(
        Object.entries(merged).filter(([, value]) => !is.null(value)),
      );
      const index = pk !== null
        ? table.findIndex(stored => stored[pk] === record[pk])
        : table.findIndex(stored => stored === record);
      table.splice(index, 1, changed);
      return changed;
    }).length;

    if (count > 0) await this.#persist(as.table);

    return count;
  }

  async delete(as: As, args: { where: DataDict }) {
    assert.nonempty(args.where);

    await this.#load(as.table);
    const table = this.#use(as.table);
    const size_before = table.length;

    this.#tables[as.table] = table.filter(record => !match(record, args.where));

    const count = size_before - this.#use(as.table).length;
    if (count > 0) await this.#persist(as.table);

    return count;
  }
}
