import type TypedArray from "@rcompat/type/TypedArray";
import type { Binary, Decimal128, ObjectId } from "mongodb";

type Param =
  bigint |
  Binary |
  boolean |
  Date |
  Decimal128 |
  number |
  ObjectId |
  string |
  TypedArray
  ;

type Validate<T extends { [K in keyof T]: Param }> = T;

type ColumnTypes = Validate<{
  BINARY: Binary;
  BOOLEAN: boolean;
  DATE: Date;
  DECIMAL: Decimal128;
  DOUBLE: number;
  INT: number;
  LONG: bigint;
  PRIMARY: ObjectId;
  STRING: string;
  TIME: string;
  UUID: string;
}>;

export type { ColumnTypes as default };
