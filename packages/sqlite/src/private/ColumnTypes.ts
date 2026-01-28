import type { PrimitiveParam } from "@rcompat/sqlite";
import type { TypedArray } from "@rcompat/type";

type Validate<T extends { [K in keyof T]: PrimitiveParam }> = T;

type ColumnTypes = Validate<{
  BLOB: TypedArray;
  INTEGER: bigint | number;
  NULL: null;
  REAL: number;
  TEXT: string;
}>;

export type { ColumnTypes as default };
