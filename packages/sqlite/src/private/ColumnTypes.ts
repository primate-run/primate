import type PrimitiveParam from "@rcompat/sqlite/PrimitiveParam";
import type TypedArray from "@rcompat/type/TypedArray";

type Validate<T extends { [K in keyof T]: PrimitiveParam }> = T;

type ColumnTypes = Validate<{
  BLOB: TypedArray;
  INTEGER: bigint | number;
  "INTEGER PRIMARY KEY": number;
  NULL: null;
  REAL: number;
  TEXT: string;
}>;

export type { ColumnTypes as default };
