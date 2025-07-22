import type As from "#db/As";
import type TypeMap from "#db/TypeMap";
import type Types from "#db/Types";
import type Dict from "@rcompat/type/Dict";
import type MaybePromise from "@rcompat/type/MaybePromise";
import type DataType from "pema/DataType";
import type StoreSchema from "pema/StoreSchema";

type DataKey = keyof DataType;
type DataValue = DataType[DataKey];
type DataDict = Dict<DataValue>;

export default abstract class Database {
  #bindPrefix: string;

  constructor(bindPrefix?: string) {
    this.#bindPrefix = bindPrefix ?? "";
  }

  #bind<K extends DataKey>(key: K, value: DataType[K]) {
    return this.typemap[key].bind(value);
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

  unbind(object: Dict, types: Types): DataDict {
    return Object.fromEntries(Object.entries(object).map(([key, value]) =>
      [key, this.#unbind(types[key], value)]));
  }

  abstract create<O extends Dict>(as: As, args: {
    record: Dict;
  }): MaybePromise<O>;

  abstract read(as: As, args: {
    criteria: Dict;
    count: true;
  }): MaybePromise<number>;
  abstract read(as: As, args: {
    criteria: Dict;
    fields?: string[];
    sort?: Dict<"asc" | "desc" | undefined>;
    limit?: number;
  }): MaybePromise<Dict[]>;

  abstract update(as: As, args: {
    criteria: Dict;
    changes: Dict;
    sort?: Dict<"asc" | "desc">;
    limit?: number;
  }): MaybePromise<number>;

  abstract delete(as: As, args: { criteria: Dict }): MaybePromise<number>;
};
