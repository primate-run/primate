import type Id from "#Id";

type DataType = {
  blob: Blob;
  boolean: boolean;
  datetime: Date;
  f32: number;
  f64: number;
  i8: number;
  i16: number;
  i32: number;
  i64: bigint;
  i128: bigint;
  string: string;
  time: string;
  u8: number;
  u16: number;
  u32: number;
  u64: bigint;
  u128: bigint;
  primary: string;
};

export type { DataType as default };
