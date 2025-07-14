import type DataType from "pema/DataType";

const types: Record<keyof DataType, string> = {
  id: "integer primary key",
  /* array */
  blob: "blob",
  boolean: "integer",
  datetime: "text",
  //embedded: "text",
  f32: "real",
  f64: "real",
  i8: "integer",
  i16: "integer",
  i32: "integer",
  i64: "integer",
  i128: "-",
  isotime: "-",
  //json: "text",
  string: "text",
  time: "text",
  u8: "integer",
  u16: "integer",
  u32: "integer",
  u64: "integer",
  u128: "_",
};

export default (value: keyof typeof types) => types[value];
