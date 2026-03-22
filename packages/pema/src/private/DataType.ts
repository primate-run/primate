import type { JSONValue } from "@rcompat/type";

type DataType = {
  blob: Blob;
  boolean: boolean;
  datetime: Date;
  f32: number;
  f64: number;
  i128: bigint;
  i16: number;
  i32: number;
  i64: bigint;
  i8: number;
  json: JSONValue;
  string: string;
  time: string;
  u128: bigint;
  u16: number;
  u32: number;
  u64: bigint;
  u8: number;
  url: URL;
  uuid: string;
  uuid_v4: string;
  uuid_v7: string;
};

export type { DataType as default };
