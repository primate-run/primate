import type { Binary, Decimal128, ObjectId } from "mongodb";

type Param =
  string |
  boolean |
  number |
  bigint |
  Date |
  ObjectId |
  NodeJS.TypedArray |
  Decimal128 |
  Binary
  ;

type Validate<T extends { [K in keyof T]: Param }> = T;

type ColumnTypes = Validate<{
  BINARY: Binary;
  BOOLEAN: boolean;
  DATE: Date;
  STRING: string;
  DOUBLE: number;
  INT: number;
  LONG: bigint;
  DECIMAL: Decimal128;
  PRIMARY: ObjectId;
  TIME: string;
  UUID: string;
}>;

export type { ColumnTypes as default };
