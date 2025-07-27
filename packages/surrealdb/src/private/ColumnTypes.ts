import type { RecordId } from "surrealdb";

type Param =
  string |
  boolean |
  number |
  bigint |
  Date |
  RecordId |
  NodeJS.TypedArray
  ;

type Validate<T extends { [K in keyof T]: Param }> = T;

type ColumnTypes = Validate<{
  BINARY: NodeJS.TypedArray;
  BOOL: boolean;
  DATETIME: Date;
  STRING: string;
  // https://surrealdb.com/docs/surrealql/datamodel/numbers
  INT: bigint;
  FLOAT: number;
  DECIMAL: bigint;
  PRIMARY: RecordId;
  TIME: string;
  UUID: string;
}>;

export type { ColumnTypes as default };
