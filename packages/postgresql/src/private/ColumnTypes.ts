import type TypedArray from "@rcompat/type/TypedArray";

type Param =
  | Array<unknown> // ANYARRAY
  | bigint         // BIGINT, NUMERIC
  | boolean        // BOOLEAN
  | Date           // DATE, TIMESTAMP, TIMESTAMPTZ
  | null           // NULL
  | number         // INT, FLOAT, NUMERIC
  | object         // JSON, JSONB
  | string         // TEXT, CHAR, VARCHAR, UUID
  | TypedArray     // BYTEA
  ;

type Validate<T extends { [K in keyof T]: Param }> = T;

type ColumnTypes = Validate<{
  BIGINT: string;
  BOOLEAN: boolean;
  BYTEA: TypedArray;
  FLOAT8: number;
  INTEGER: number;
  "NUMERIC(20, 0)": string;
  "NUMERIC(39, 0)": string;
  REAL: number;
  "SERIAL PRIMARY KEY": number;
  SMALLINT: number;
  TEXT: string;
  TIME: string;
  TIMESTAMP: Date;
  UUID: string;
}>;
export type { ColumnTypes as default };
