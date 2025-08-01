import type TypedArray from "@rcompat/type/TypedArray";
import type { RecordId } from "surrealdb";

type Param =
  | bigint
  | boolean
  | Date
  | number
  | RecordId
  | string
  | TypedArray
  ;

type Validate<T extends { [K in keyof T]: Param }> = T;

type ColumnTypes = Validate<{
  BINARY: TypedArray;
  BOOL: boolean;
  DATETIME: Date;
  DECIMAL: bigint;
  FLOAT: number;
  // https://surrealdb.com/docs/surrealql/datamodel/numbers
  INT: bigint;
  PRIMARY: RecordId;
  STRING: string;
  TIME: string;
  UUID: string;
}>;

export type { ColumnTypes as default };
