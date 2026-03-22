import type As from "#db/As";
import type PK from "#db/PK";
import type Sort from "#db/Sort";
import type Types from "#db/Types";
import type With from "#db/With";
import type { Dict, MaybePromise } from "@rcompat/type";
import type { DataType, StoreSchema } from "pema";

export interface SchemaDiff {
  add: Types;
  drop: string[];
  rename: [string, string][];
};

type MaybeTable = Dict<(keyof DataType)[]> | null;

export default interface DB {
  schema: {
    create(as: As, schema: StoreSchema): MaybePromise<void>;
    delete(name: string): MaybePromise<void>;
    introspect(name: string, pk?: PK): MaybePromise<MaybeTable>;
    alter(name: string, diff: SchemaDiff): MaybePromise<void>;
  };

  close(): MaybePromise<void>;

  create<O extends Dict>(as: As, record: Dict): MaybePromise<O>;

  read(as: As, args: {
    count: true;
    where: Dict;
    with?: never;
  }): MaybePromise<number>;

  read(as: As, args: {
    where: Dict;
    fields?: string[];
    limit?: number;
    sort?: Sort;
    with?: With;
  }): MaybePromise<Dict[]>;

  update(as: As, args: {
    set: Dict;
    where: Dict;
  }): MaybePromise<number>;

  delete(as: As, args: { where: Dict }): MaybePromise<number>;
}
