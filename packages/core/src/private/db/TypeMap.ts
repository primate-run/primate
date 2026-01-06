import type { Dict, MaybePromise } from "@rcompat/type";
import type { DataType } from "pema";

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
