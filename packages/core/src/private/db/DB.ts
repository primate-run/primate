import type As from "#db/As";
import type AsPK from "#db/AsPK";
import type PK from "#db/PK";
import type Sort from "#db/Sort";
import type With from "#db/With";
import type { Dict, MaybePromise } from "@rcompat/type";
import type { StoreSchema } from "pema";

export default interface DB {
  schema: {
    create(name: string, description: StoreSchema, pk: PK): MaybePromise<void>;
    delete(name: string): MaybePromise<void>;
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

  lastId(as: AsPK): MaybePromise<number | bigint>;
}
