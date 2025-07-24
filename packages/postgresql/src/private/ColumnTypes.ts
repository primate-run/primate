type Param =
  string |            // TEXT, CHAR, VARCHAR, UUID
  number |            // INT, FLOAT, NUMERIC
  bigint |            // BIGINT, NUMERIC
  boolean |           // BOOLEAN
  Date |              // DATE, TIMESTAMP, TIMESTAMPTZ
  NodeJS.TypedArray | // BYTEA
  null |              // NULL
  Array<unknown> |    // ANYARRAY
  object              // JSON, JSONB
  ;

type Validate<T extends { [K in keyof T]: Param }> = T;

type ColumnTypes = Validate<{
  BYTEA: NodeJS.TypedArray;
  BOOLEAN: boolean;
  TIMESTAMP: Date;
  REAL: number;
  FLOAT8: number;
  TEXT: string;
  SMALLINT: number;
  INTEGER: number;
  BIGINT: string;
  "NUMERIC(20, 0)": string;
  "NUMERIC(39, 0)": string;
  "SERIAL PRIMARY KEY": number;
  TIME: string;
  UUID: string;
}>;

export type { ColumnTypes as default };
