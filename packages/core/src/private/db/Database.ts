import type As from "#db/As";
import type DataDict from "#db/DataDict";
import type DataKey from "#db/DataKey";
import type TypeMap from "#db/TypeMap";
import type Types from "#db/Types";
import entries from "@rcompat/record/entries";
import type Dict from "@rcompat/type/Dict";
import type MaybePromise from "@rcompat/type/MaybePromise";
import type DataType from "pema/DataType";
import type StoreSchema from "pema/StoreSchema";

export default abstract class Database {
  #bindPrefix: string;

  constructor(bindPrefix?: string) {
    this.#bindPrefix = bindPrefix ?? "";
  }

  #bind<K extends DataKey>(key: K, value: DataType[K] | null) {
    return value === null
      ? null
      : this.typemap[key].bind(value);
  }

  #unbind(key: DataKey, value: unknown) {
    return this.typemap[key].unbind(value);
  }

  column(key: DataKey) {
    return this.typemap[key].column;
  };

  abstract get typemap(): TypeMap;

  abstract schema: {
    create(name: string, description: StoreSchema): MaybePromise<void>;
    delete(name: string): MaybePromise<void>;
  };

  async bind<In extends DataDict>(object: In, types: Types) {
    return Object.fromEntries(await Promise.all(Object.entries(object)
      .map(async ([key, value]) =>
        [`${this.#bindPrefix}${key}`, await this.#bind(types[key], value)])));
  }

  unbind(object: Dict, types: Types): Dict {
    return entries(object)
      .filter(([, value]) => value !== null)
      .map(([key, value]) => [key, this.#unbind(types[key], value)])
      .get();
  }

  abstract create<O extends Dict>(as: As, args: {
    record: Dict;
  }): MaybePromise<O>;

  abstract read(as: As, args: {
    count: true;
    criteria: Dict;
  }): MaybePromise<number>;
  abstract read(as: As, args: {
    criteria: Dict;
    fields?: string[];
    limit?: number;
    sort?: Dict<"asc" | "desc" | undefined>;
  }): MaybePromise<Dict[]>;

  abstract update(as: As, args: {
    changes: Dict;
    criteria: Dict;
    limit?: number;
    sort?: Dict<"asc" | "desc">;
  }): MaybePromise<number>;

  abstract delete(as: As, args: { criteria: Dict }): MaybePromise<number>;
};
