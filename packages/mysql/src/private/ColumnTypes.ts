type Param = NodeJS.TypedArray
  | string
  | number
  | bigint
  | boolean
  | Date
  | null;

type Validate<T extends { [K in keyof T]: Param }> = T;

type ColumnTypes = Validate<{
  BLOB: NodeJS.TypedArray;
  BOOL: number;
  "DATETIME(3)": Date;
  DOUBLE: number;
  TEXT: string;
  TINYINT: number;
  SMALLINT: number;
  INT: number;
  BIGINT: string;
  "DECIMAL(39, 0)": string;
  "INT NOT NULL AUTO_INCREMENT PRIMARY KEY": number;
  "TIME": string;
  "TINYINT UNSIGNED": number;
  "SMALLINT UNSIGNED": number;
  "INT UNSIGNED": number;
  "BIGINT UNSIGNED": string;
}>;

export type { ColumnTypes as default };
