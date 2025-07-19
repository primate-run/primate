import type As from "#db/As";
import type Dict from "@rcompat/type/Dict";
import type MaybePromise from "@rcompat/type/MaybePromise";
import type StoreSchema from "pema/StoreSchema";

export default abstract class Database {
  abstract schema: {
    create(name: string, description: StoreSchema): MaybePromise<void>;
    delete(name: string ): MaybePromise<void>;
  };

  abstract create<O extends Dict>(as: As, args: {
    document: Dict;
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
    delta: Dict;
    count?: true;
  }): MaybePromise<number>;
  abstract update(as: As, args: {
    criteria: Dict;
    delta: Dict;
    sort?: Dict<"asc" | "desc">;
    limit?: number;
  }): MaybePromise<Dict[]>;

  abstract delete(as: As, args: {
    criteria: Dict;
  }): MaybePromise<void>;
};
