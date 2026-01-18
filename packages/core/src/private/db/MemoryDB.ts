import type As from "#db/As";
import type ColumnTypes from "#db/ColumnTypes";
import type { With } from "#db/DB";
import DB from "#db/DB";
import type DataDict from "#db/DataDict";
import type Sort from "#db/Sort";
import type TypeMap from "#db/TypeMap";
import fail from "#fail";
import assert from "@rcompat/assert";
import entries from "@rcompat/dict/entries";
import is from "@rcompat/is";
import type { Dict, MaybePromise, PartialDict } from "@rcompat/type";

function escape_re(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function comparable(x: unknown) {
  if (x instanceof Date) return x.getTime();
  if (x instanceof URL) return x.href;
  return x as any;
};

function match(record: Dict, criteria: Dict) {
  return Object.entries(criteria).every(([k, v]) => {
    const value = record[k];

    if (v === undefined) throw fail("undefined criteria for {0}", k);

    // null criteria (IS NULL semantics in this DB == key absent)
    if (v === null) return !Object.hasOwn(record, k);

    // operator objects: only plain dicts
    if (is.dict(v)) {
      if (Object.keys(v).length === 0) throw fail("empty operator object");

      // NULL / missing values don't match operator predicates
      if (value === null || value === undefined) return false;

      for (const [op, op_value] of Object.entries(v)) {
        switch (op) {
          case "$like": {
            if (typeof op_value !== "string") {
              throw fail("$like operator requires string, got {0}", typeof op_value);
            }
            const regex = new RegExp(
              "^" + escape_re(op_value).replace(/%/g, ".*").replace(/_/g, ".") + "$",
            );
            if (!regex.test(String(value))) return false;
            break;
          }

          case "$gte":
            if (!(comparable(value) >= comparable(op_value))) return false;
            break;

          case "$gt":
          case "$after":
            if (!(comparable(value) > comparable(op_value))) return false;
            break;

          case "$lte":
            if (!(comparable(value) <= comparable(op_value))) return false;
            break;

          case "$lt":
          case "$before":
            if (!(comparable(value) < comparable(op_value))) return false;
            break;

          case "$ne": {
            if (value instanceof Date && op_value instanceof Date) {
              if (value.getTime() === op_value.getTime()) return false;
              break;
            }
            if (value instanceof URL && op_value instanceof URL) {
              if (value.href === op_value.href) return false;
              break;
            }
            if (value === op_value) return false;
            break;
          }

          default:
            throw fail("unsupported operator in field {0}", k);
        }
      }

      return true;
    }

    // literal equality
    if (value instanceof Date && v instanceof Date) return value.getTime() === v.getTime();
    if (value instanceof URL && v instanceof URL) return value.href === v.href;

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

function ident<C extends keyof ColumnTypes>(column: C): {
  bind: (value: ColumnTypes[C]) => ColumnTypes[C];
  column: C;
  unbind: (value: ColumnTypes[C]) => ColumnTypes[C];
} {
  return {
    bind: value => value,
    column,
    unbind: value => value,
  };
}

const typemap: TypeMap<ColumnTypes> = {
  blob: ident("BLOB"),
  boolean: ident("BOOLEAN"),
  datetime: ident("DATE"),
  f32: ident("NUMBER"),
  f64: ident("NUMBER"),
  i128: ident("BIGINT"),
  i16: ident("NUMBER"),
  i32: ident("NUMBER"),
  i64: ident("BIGINT"),
  i8: ident("NUMBER"),
  string: ident("STRING"),
  time: ident("STRING"),
  u128: ident("BIGINT"),
  u16: ident("NUMBER"),
  u32: ident("NUMBER"),
  u64: ident("BIGINT"),
  u8: ident("NUMBER"),
  url: ident("URL"),
};

export default class MemoryDB extends DB {
  #collections: PartialDict<Dict[]> = {};

  get typemap() {
    return typemap as unknown as TypeMap<Dict>;
  }

  #new(name: string) {
    if (this.#collections[name] !== undefined) return;
    this.#collections[name] = [];
  }

  #drop(name: string) {
    if (this.#collections[name] === undefined) {
      // do nothing
    }
    delete this.#collections[name];
  }

  #use(name: string) {
    this.#collections[name] ??= [];
    return this.#collections[name];
  }

  get schema() {
    return {
      create: this.#new.bind(this),
      delete: this.#drop.bind(this),
    };
  }

  // noop
  close() { }

  create<O extends Dict>(as: As, args: { record: Dict }) {
    assert.nonempty(args.record, "empty record");

    const record: Dict = args.record;
    const collection = this.#use(as.name);
    const pk = as.pk;

    if (pk !== null) {
      assert.true(["string", "number", "bigint"].includes(typeof record[pk]),
        fail("pk must be string, number or bigint, got {0}", record[pk]));
      if (collection.find(stored => stored[pk] === record[pk])) {
        throw fail("pk {0} already exists in the database", record[pk]);
      }
    }

    collection.push({ ...record });

    return record as MaybePromise<O>;
  }

  read(as: As, args: {
    count: true;
    criteria: DataDict;
    with?: never;
  }): number;
  read(as: As, args: {
    criteria: DataDict;
    fields?: string[];
    limit?: number;
    sort?: Sort;
    with?: With;
  }): Dict[];
  read(as: As, args: {
    count?: true;
    criteria: DataDict;
    fields?: string[];
    limit?: number;
    sort?: Sort;
    with?: With;
  }): Dict[] | number {
    assert.dict(args.criteria);

    this.toWhere(as.types, args.criteria);
    if (args.fields !== undefined) this.toSelect(as.types, args.fields);
    if (args.sort !== undefined) this.toSort(as.types, args.sort);

    const collection = this.#use(as.name);
    const matches = collection.filter(r => match(r, args.criteria));

    if (args.count === true) {
      if (args.with !== undefined) throw fail("cannot combine count with with");
      return matches.length;
    }

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
      if (rel === undefined) continue;

      const target_as = rel.as;
      const kind = rel.kind;
      const fk = rel.fk;
      const reverse = rel.reverse === true;

      const r_criteria = rel.criteria;
      const r_sort = rel.sort;
      const r_limit = rel.limit;
      const r_fields = rel.fields ?? [];

      // validate subqueru
      this.toWhere(target_as.types, r_criteria);
      if (rel.fields !== undefined) this.toSelect(target_as.types, rel.fields);
      if (r_sort !== undefined) this.toSort(target_as.types, r_sort);

      const target = this.#use(target_as.name);

      function project_rel(row: Dict) {
        if (r_fields.length === 0) return { ...row };
        return filter(row, r_fields);
      };

      // reverse one: FK on parent points to target PK
      if (kind === "one" && reverse) {
        const target_pk = target_as.pk;
        if (target_pk === null) throw fail("reverse one requires target primary key");

        for (let i = 0; i < out.length; i++) {
          const parent_full = base_full[i];
          const fk_value = parent_full[fk];

          if (fk_value == null) {
            (out[i])[r_name] = null;
            continue;
          }

          // filter by target_pk equality + optional criteria
          let candidates = target.filter(t =>
            t[target_pk] === fk_value && match(t, r_criteria),
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
      if (parent_pk === null) throw fail("relation loading requires parent primary key");

      const parent_keys = new Set(base_full.map(r => r[parent_pk]));
      const grouped = new Map<unknown, Dict[]>();

      for (const row of target) {
        const key = row[fk];
        if (!parent_keys.has(key)) continue;
        if (!match(row, r_criteria)) continue;

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

  async update(as: As, args: { changeset: DataDict; criteria: DataDict }) {
    assert.nonempty(args.changeset, "empty changeset");
    assert.dict(args.criteria);

    this.toWhere(as.types, args.criteria);
    await this.toSet(as.types, args.changeset);

    const collection = this.#use(as.name);
    const matched = collection.filter(record => match(record, args.criteria));
    const pk = as.pk;

    return matched.map(record => {
      const changed = entries({ ...record, ...args.changeset })
        .filter(([, value]) => value !== null)
        .get();
      const index = pk !== null
        ? collection.findIndex(stored => stored[pk] === record[pk])
        : collection.findIndex(stored => stored === record);
      collection.splice(index, 1, changed);
      return changed;
    }).length;
  }

  delete(as: As, args: { criteria: DataDict }) {
    assert.nonempty(args.criteria, "empty criteria");

    this.toWhere(as.types, args.criteria);

    const collection = this.#use(as.name);
    const size_before = collection.length;

    this.#collections[as.name] = collection
      .filter(record => !match(record, args.criteria));

    return size_before - this.#use(as.name).length;
  }

  lastId(name: string, pk: string): number | bigint {

    const collection = this.#use(name);
    if (collection.length === 0) return 0;

    return collection[collection.length - 1][pk] as number | bigint;
  }
}
