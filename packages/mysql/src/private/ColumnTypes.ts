import type TypedArray from "@rcompat/type/TypedArray";

type Param =
  | bigint
  | boolean
  | Date
  | null
  | number
  | string
  | TypedArray;

type Validate<T extends { [K in keyof T]: Param }> = T;

type ColumnTypes = Validate<{
  BIGINT: string;
  "BIGINT UNSIGNED": string;
  BLOB: Uint8Array<ArrayBuffer>;
  BOOL: number;
  "DATETIME(3)": Date;
  "DECIMAL(39, 0)": string;
  DOUBLE: number;
  INT: number;
  "INT NOT NULL AUTO_INCREMENT PRIMARY KEY": number;
  "INT UNSIGNED": number;
  SMALLINT: number;
  "SMALLINT UNSIGNED": number;
  TEXT: string;
  "TIME": string;
  TINYINT: number;
  "TINYINT UNSIGNED": number;
}>;

export type { ColumnTypes as default };
