import AppError from "#AppError";
import type As from "#db/As";
import type ColumnTypes from "#db/ColumnTypes";
import Database from "#db/Database";
import type TypeMap from "#db/TypeMap";
import entries from "@rcompat/record/entries";
import type Dict from "@rcompat/type/Dict";
import type MaybePromise from "@rcompat/type/MaybePromise";
import type PartialDict from "@rcompat/type/PartialDict";

const match = (record: Dict, criteria: Dict) =>
  Object.entries(criteria).every(([key, value]) =>
    record[key] === value);

const filter = (record: Dict, fields: string[]) =>
  Object.fromEntries(Object.entries(record)
    .filter(([key]) => fields.includes(key)));

const to_sorted = <T extends Dict>(d1: T, d2: T, sort: Dict<"asc" | "desc">) =>
  [...entries(sort).valmap(([, value]) => value === "asc" ? 1 : -1)]
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

function ident<C extends keyof ColumnTypes>(column: C): {
  column: C;
  bind: (value: ColumnTypes[C]) => ColumnTypes[C];
  unbind: (value: ColumnTypes[C]) => ColumnTypes[C];
} {
  return {
    column,
    bind: value => value,
    unbind: value => value,
  };
}

const typemap: TypeMap<ColumnTypes> = {
  blob: ident("BLOB"),
  boolean: ident("BOOLEAN"),
  datetime: ident("DATE"),
  f32: ident("NUMBER"),
  f64: ident("NUMBER"),
  string: ident("STRING"),
  i8: ident("NUMBER"),
  i16: ident("NUMBER"),
  i32: ident("NUMBER"),
  i64: ident("BIGINT"),
  i128: ident("BIGINT"),
  primary: ident("STRING"),
  time: ident("STRING"),
  u8: ident("NUMBER"),
  u16: ident("NUMBER"),
  u32: ident("NUMBER"),
  u64: ident("BIGINT"),
  u128: ident("BIGINT"),
};

export default class InMemoryDatabase extends Database {
  #collections: PartialDict<Dict[]> = {};

  get typemap() {
    return typemap as unknown as TypeMap<Dict>;
  }

  #new(name: string) {
    if (this.#collections[name] !== undefined) {
      throw new AppError(`collection ${name} already exists`);
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

  create<O extends Dict>(as: As, args: { record: Dict }) {
    const collection = this.#use(as.name);
    const record = { ...args.record };
    if (record.id === undefined) {
      record.id = crypto.randomUUID();
    };
    if (typeof record.id !== "string") {
      throw new AppError(`id must be string, got: ${record.id}`);
    }
    if (collection.find(stored => stored.id === record.id)) {
      throw new AppError(`id ${record.id} already existed in the database`);
    }
    collection.push({ ...record });

    return record as MaybePromise<O>;
  }

  read(as: As, args: {
    criteria: Dict;
    count: true;
  }): number;
  read(as: As, args: {
    criteria: Dict;
    fields?: string[];
    sort?: Dict<"asc" | "desc">;
    limit?: number;
  }): Dict[];
  read(as: As, args: {
    criteria: Dict;
    fields?: string[];
    count?: true;
    sort?: Dict<"asc" | "desc">;
    limit?: number;
  }): number | Dict[] {
    const collection = this.#use(as.name);
    const matches = collection
      .filter(record => match(record, args.criteria));

    if (args.count === true) {
      return matches.length;
    }

    const fields = args.fields ?? [];
    const sort = args.sort ?? {};

    const sorted = Object.keys(sort).length === 0
      ? matches
      : matches.toSorted((a, b) => to_sorted(a, b, sort));
    const limit = args.limit ?? sorted.length;

    return (fields.length === 0
      ? sorted
      : sorted.map(s => filter(s, fields))).slice(0, limit);
  }

  update(as: As, args: {
    criteria: Dict;
    changes: Dict;
    sort?: Dict<"asc" | "desc">;
    limit?: number;
  }): MaybePromise<number> {
    const collection = this.#use(as.name);
    const { criteria } = args;

    const matched = collection.filter(record => match(record, criteria));
    const limit = args.limit ?? matched.length;

    const updated = matched.slice(0, limit).map(record => {
      const changed = entries({ ...record, ...args.changes })
        .filter(([, value]) => value !== null)
        .get();
      const index = collection.findIndex(stored => stored.id === record.id);
      collection.splice(index, 1, changed);
      return changed;
    });

    return updated.length;
  }

  delete(as: As, args: { criteria: Dict }) {
    const collection = this.#use(as.name);
    const size_before = Object.keys(collection).length;

    this.#collections[as.name] = collection
      .filter(record => !match(record, args.criteria));

    return size_before - Object.keys(this.#use(as.name)).length;
  }
}
