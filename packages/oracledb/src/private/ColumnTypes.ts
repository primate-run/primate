import type { JSONValue, TypedArray } from "@rcompat/type";

type Param =
  | Array<unknown>
  | bigint
  | boolean
  | Date
  | null
  | number
  | object
  | string
  | TypedArray
  ;

type Validate<T extends { [K in keyof T]: Param }> = T;

type ColumnTypes = Validate<{
  BOOLEAN: boolean;
  BLOB: TypedArray;
  BINARY_FLOAT: number;
  BINARY_DOUBLE: number;
  NUNBER: number;
  "NUMBER(3)": number;
  "NUMBER(5)": number;
  "NUMBER(10)": number;
  "NUMBER(20)": string;
  "VARCHAR2(36)": string;
  "VARCHAR2(40)": string;
  "VARCHAR2(4000)": string;
  TIMESTAMP: Date;
  JSON: JSONValue;
}>;

export type { ColumnTypes as default };
