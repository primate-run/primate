import type MaybePromise from "@rcompat/type/MaybePromise";
import type DataType from "pema/DataType";
import type Dict from "@rcompat/type/Dict";

type TypeMap<Columns extends Dict = Dict> = {
  [K in keyof DataType]: {
    [C in keyof Columns]: {
      bind: (value: DataType[K]) => MaybePromise<Columns[C]>;
      column: C;
      unbind: (value: Columns[C]) => DataType[K];
    };
  }[keyof Columns];
};

export type { TypeMap as default };
