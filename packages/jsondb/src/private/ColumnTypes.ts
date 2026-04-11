import type { JSONValue } from "@rcompat/type";

type ColumnTypes = {
  BIGINT: bigint;
  BLOB: Blob;
  BOOLEAN: boolean;
  DATE: Date;
  JSON: JSONValue;
  NUMBER: number;
  STRING: string;
  URL: URL;
};

export type { ColumnTypes as default };
