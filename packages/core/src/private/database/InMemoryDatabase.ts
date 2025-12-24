import type As from "#database/As";
import type ColumnTypes from "#database/ColumnTypes";
import Database from "#database/Database";
import type DataDict from "#database/DataDict";
import type Sort from "#database/Sort";
import type TypeMap from "#database/TypeMap";
import fail from "#fail";
import assert from "@rcompat/assert";
import entries from "@rcompat/dict/entries";
import type { Dict, MaybePromise, PartialDict } from "@rcompat/type";

function match(record: Dict, criteria: Dict) {
  return Object.entries(criteria).every(([k, v]) => {
    const value = record[k];

    // null criteria (IS NULL semantics)
    if (v === null) return !Object.hasOwn(record, k);

    // handle operator objects
    if (typeof v === "object") {
      // $like operator
      if ("$like" in v) {
        // NULL values don't match LIKE patterns
        if (value === null || value === undefined) return false;

        const $like = v.$like;
        if (typeof $like !== "string")
          throw fail("$like operator requires string, got {0}", typeof $like);
        const regex = new RegExp(
          "^" + $like.replace(/%/g, ".*").replace(/\?/g, ".") + "$",
        );
        return regex.test(String(value));
      }

      // future: number operators
      // if ("$gte" in v) return recordValue >= v.$gte;
      // if ("$gt" in v) return recordValue > v.$gt;
      // if ("$lte" in v) return recordValue <= v.$lte;
      // if ("$lt" in v) return recordValue < v.$lt;

      return false; // unknown operator
    }

    // direct equality match
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
  primary: ident("STRING"),
  string: ident("STRING"),
  time: ident("STRING"),
  u128: ident("BIGINT"),
  u16: ident("NUMBER"),
  u32: ident("NUMBER"),
  u64: ident("BIGINT"),
  u8: ident("NUMBER"),
  url: ident("URL"),
};

export default class InMemoryDatabase extends Database {
  #collections: PartialDict<Dict[]> = {};

  get typemap() {
    return typemap as unknown as TypeMap<Dict>;
  }

  #new(name: string) {
    if (this.#collections[name] !== undefined) {
      throw fail("collection {0} already exists", name);
    }
    this.#collections[name] = [];
  }

  #drop(name: string) {
    if (this.#collections[name] === undefined) {
      // do nothing
    }
    delete this.#collections[name];
  }

  #use(name: string) {
    if (this.#collections[name] === undefined) {
      this.#collections[name] = [];
    }
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

    const record: Dict = {
      ...args.record,
      id: args.record.id ?? crypto.randomUUID(),
    };

    const collection = this.#use(as.name);
    assert.string(record.id, fail("id must be string, got {0}", record.id));

    if (collection.find(stored => stored.id === record.id)) {
      throw fail("id {0} already exists in the database", record.id);
    }
    collection.push({ ...record });

    return record as MaybePromise<O>;
  }

  read(as: As, args: {
    count: true;
    criteria: DataDict;
  }): number;
  read(as: As, args: {
    criteria: DataDict;
    fields?: string[];
    limit?: number;
    sort?: Sort;
  }): Dict[];
  read(as: As, args: {
    count?: true;
    criteria: DataDict;
    fields?: string[];
    limit?: number;
    sort?: Sort;
  }): Dict[] | number {
    assert.dict(args.criteria);

    this.toWhere(as.types, args.criteria);
    if (args.fields !== undefined) this.toSelect(as.types, args.fields);
    if (args.sort !== undefined) this.toSort(as.types, args.sort);

    const collection = this.#use(as.name);
    const matches = collection.filter(r => match(r, args.criteria));

    if (args.count === true) return matches.length;

    const sort = args.sort ?? {};
    const sorted = Object.keys(sort).length === 0
      ? matches
      : matches.toSorted((a, b) => toSorted(a, b, sort));

    const limit = args.limit ?? sorted.length;

    const fields = args.fields ?? [];

    return (fields.length === 0
      ? sorted
      : sorted.map(s => filter(s, fields))).slice(0, limit);
  }

  async update(as: As, args: { changeset: DataDict; criteria: DataDict }) {
    assert.nonempty(args.changeset, "empty changeset");
    assert.nonempty(args.criteria, "empty criteria");

    this.toWhere(as.types, args.criteria);
    await this.toSet(as.types, args.changeset);

    const collection = this.#use(as.name);
    const matched = collection.filter(record => match(record, args.criteria));

    return matched.map(record => {
      const changed = entries({ ...record, ...args.changeset })
        .filter(([, value]) => value !== null)
        .get();
      const index = collection.findIndex(stored => stored.id === record.id);
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
}
