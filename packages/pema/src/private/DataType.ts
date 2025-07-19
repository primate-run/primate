//import type EO from "@rcompat/type/EO";
import type Id from "#Id";

type DataType = {
  //array: unknown[];
  blob: Blob;
  //typedarray: Uint8Array;
  boolean: boolean;
  datetime: Date;
  //document: EO;
  f32: number;
  f64: number;
  i8: number;
  i16: number;
  i32: number;
  i64: bigint;
  i128: bigint;
  //json: EO;
  string: string;
  time: Date;
  //isotime: string;
  u8: number;
  u16: number;
  u32: number;
  u64: bigint;
  u128: bigint;
  primary: string;
};

export type { DataType as default };
