import type As from "#db/As";
import type DB from "#db/DB";
import type DataDict from "#db/DataDict";
import type Sort from "#db/Sort";
import type With from "#db/With";
import E from "#db/error";
import assert from "@rcompat/assert";
import entries from "@rcompat/dict/entries";
import is from "@rcompat/is";
import type { Dict, MaybePromise, PartialDict } from "@rcompat/type";

const PK_TYPES = ["string", "bigint", "number"];

function escape_re(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function comparable(x: unknown) {
  if (is.date(x)) return x.getTime();
  if (is.url(x)) return x.href;
  return x as any;
};

function like_re(pattern: string, flags = "") {
  return new RegExp(
    "^" + escape_re(pattern)
      .replace(/\\%/g, "<<PERCENT>>")
      .replace(/\\_/g, "<<UNDERSCORE>>")
      .replace(/%/g, "[\\s\\S]*")
      .replace(/_/g, "[\\s\\S]")
      .replace(/<<PERCENT>>/g, "%")
      .replace(/<<UNDERSCORE>>/g, "_") +
    "$", flags);
}

function match(record: Dict, where: Dict) {
  return Object.entries(where).every(([k, v]) => {
    const value = record[k];

    // null where (IS NULL semantics in this DB == key absent)
    if (v === null) return value === null || value === undefined;

    // operator objects: only plain dicts
    if (is.dict(v)) {
      // NULL / missing values don't match operator predicates
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

    // literal equality
    if (is.date(value) && is.date(v)) return value.getTime() === v.getTime();
    if (is.url(value) && is.url(v)) return value.href === v.href;

    return value === v;
  });
}

function filter(record: Dict, fields: string[]) {
  return Object.fromEntries(Object.entries(record)
    .filter(([key]) => fields.includes(key)));
}

function toSorted<T extends Dict>(d1: T, d2: T, sort: Sort) {
  return [...entries(sort).valmap(([, value]) => value === "asc" ? 1 : -1)]
    .reduce((sorting, [field, direction]) => {
      const left = d1[field] as T[keyof T];
      const right = d2[field] as typeof left;

      // if sorting has been established, it stays fixed
      if (sorting !== 0) {
        return sorting;
      }
      // equal, sorting doesn't change
      if (left === right) {
        return sorting;
      }

      if (left < right) {
        return -1 * direction;
      }

      return direction;
    }, 0);
}

export default class MemoryDB implements DB {
  #tables: PartialDict<Dict[]> = {};

  #new(as: As) {
    if (this.#tables[as.table] !== undefined) return;
    this.#tables[as.table] = [];
  }

  #drop(table: string) {
    if (this.#tables[table] !== undefined) delete this.#tables[table];
  }

  #use(name: string) {
    this.#tables[name] ??= [];
    return this.#tables[name];
  }

  get schema() {
    return {
      create: this.#new.bind(this),
      delete: this.#drop.bind(this),
    };
  }

  // noop
  close() { }

  #next_id(as: As) {
    const table = this.#use(as.table);
    const size = table.length;
    const pk = assert.defined(as.pk);
    const type = as.types[pk];

    if (type === "string") {
      return crypto.randomUUID();
    } else if (["u64", "u128", "i64", "i128"].includes(type)) {
      return size === 0 ? 0n : table[size - 1][pk] as bigint + 1n;
    } else {
      return size === 0 ? 0 : table[size - 1][pk] as number + 1;
    }
  }

  create<O extends Dict>(as: As, record: Dict) {
    assert.nonempty(record, "empty record");
    const table = this.#use(as.table);
    const pk = as.pk;

    let to_insert = record;

    if (pk !== null && !(pk in record)) {
      if (as.generate_pk === false) throw E.pk_required(pk);
      to_insert = { ...record, [pk]: this.#next_id(as) };
    }

    if (pk !== null) {
      const pkv = to_insert[pk];
      if (!PK_TYPES.includes(typeof pkv)) throw E.pk_invalid(pkv);
      if (table.find(stored => stored[pk] === pkv)) throw E.pk_duplicate(pk);
    }

    table.push({ ...to_insert });
    return to_insert as MaybePromise<O>;
  }

  read(as: As, args: {
    count: true;
    where: DataDict;
    with?: never;
  }): number;
  read(as: As, args: {
    where: DataDict;
    fields?: string[];
    limit?: number;
    sort?: Sort;
    with?: With;
  }): Dict[];
  read(as: As, args: {
    count?: true;
    where: DataDict;
    fields?: string[];
    limit?: number;
    sort?: Sort;
    with?: With;
  }): Dict[] | number {
    assert.dict(args.where);

    const table = this.#use(as.table);
    const matches = table.filter(r => match(r, args.where));

    if (args.count === true) return matches.length;

    const sort = args.sort ?? {};
    const sorted = Object.keys(sort).length === 0
      ? matches
      : matches.toSorted((a, b) => toSorted(a, b, sort));

    const limit = args.limit ?? sorted.length;
    const base_rows = sorted.slice(0, limit);

    // no relations -> preserve existing behavior
    if (args.with === undefined) {
      const fields = args.fields ?? [];
      return (fields.length === 0
        ? base_rows
        : base_rows.map(r => filter(r, fields)));
    }

    assert.dict(args.with);

    const base_fields = args.fields ?? [];

    // output objects must be detached, so as to not mutate stored rows whilst
    // attaching relations
    const out = base_rows.map(full => {
      return base_fields.length === 0
        ? { ...full }
        : filter(full, base_fields);
    });

    // need access to the full base rows to read join keys even if not projected
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
      const target = this.#use(target_as.table);

      function project_rel(row: Dict) {
        if (r_fields.length === 0) return { ...row };
        return filter(row, r_fields);
      };

      // reverse one: FK on parent points to target PK
      if (kind === "one" && reverse) {
        const target_pk = target_as.pk;
        if (target_pk === null) throw E.relation_requires_pk("target");

        for (let i = 0; i < out.length; i++) {
          const parent_full = base_full[i];
          const fk_value = parent_full[fk];

          if (fk_value == null) {
            (out[i])[r_name] = null;
            continue;
          }

          // filter by target_pk equality + optional where
          let candidates = target.filter(t =>
            t[target_pk] === fk_value && match(t, r_where),
          );

          if (r_sort && Object.keys(r_sort).length > 0) {
            candidates = candidates.toSorted((a, b) => toSorted(a, b, r_sort));
          }

          if (r_limit !== undefined) candidates = candidates.slice(0, r_limit);

          const got = candidates[0];
          (out[i])[r_name] = got ? project_rel(got) : null;
        }

        continue;
      }

      // non-reverse: FK on target points to parent PK
      const parent_pk = as.pk;
      if (parent_pk === null) throw E.relation_requires_pk("parent");

      const parent_keys = new Set(base_full.map(r => r[parent_pk]));
      const grouped = new Map<unknown, Dict[]>();

      for (const row of target) {
        const key = row[fk];
        if (!parent_keys.has(key)) continue;
        if (!match(row, r_where)) continue;

        const bucket = grouped.get(key);
        if (bucket) bucket.push(row);
        else grouped.set(key, [row]);
      }

      for (let i = 0; i < out.length; i++) {
        const parent_full = base_full[i];
        const key = parent_full[parent_pk];

        let rows = grouped.get(key) ?? [];

        if (r_sort && Object.keys(r_sort).length > 0) {
          rows = rows.toSorted((a, b) => toSorted(a, b, r_sort));
        }

        if (kind === "one") {
          if (r_limit !== undefined) rows = rows.slice(0, r_limit);
          const got = rows[0];
          (out[i])[r_name] = got ? project_rel(got) : null;
        } else {
          if (r_limit !== undefined) rows = rows.slice(0, r_limit);
          (out[i])[r_name] = rows.map(project_rel);
        }
      }
    }

    return out;
  }

  async update(as: As, args: { set: DataDict; where: DataDict }) {
    assert.nonempty(args.set);
    assert.dict(args.where);

    const table = this.#use(as.table);
    const matched = table.filter(record => match(record, args.where));
    const pk = as.pk;

    return matched.map(record => {
      const changed = entries({ ...record, ...args.set })
        .filter(([, value]) => value !== null)
        .get();
      const index = pk !== null
        ? table.findIndex(stored => stored[pk] === record[pk])
        : table.findIndex(stored => stored === record);
      table.splice(index, 1, changed);
      return changed;
    }).length;
  }

  delete(as: As, args: { where: DataDict }) {
    assert.nonempty(args.where);

    const table = this.#use(as.table);
    const size_before = table.length;

    this.#tables[as.table] = table.filter(record => !match(record, args.where));

    return size_before - this.#use(as.table).length;
  }
}
