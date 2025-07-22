import type PrimitiveParam from "@rcompat/sqlite/PrimitiveParam";

type Validate<T extends { [K in keyof T]: PrimitiveParam }> = T;

type ColumnTypes = Validate<{
  BLOB: NodeJS.TypedArray;
  INTEGER: number | bigint;
  TEXT: string;
  REAL: number;
  NULL: null;
  "INTEGER PRIMARY KEY": number;
}>;

export type { ColumnTypes as default };
