import type ColumnTypes from "#ColumnTypes";
import type { TypeMap } from "@primate/core/db";

function identity<C extends keyof ColumnTypes>(column: C): {
  bind: (value: ColumnTypes[C]) => ColumnTypes[C];
  column: C;
  unbind: (value: ColumnTypes[C]) => ColumnTypes[C];
} {
  return {
    bind: value => value,
    column,
    unbind: value => value,
  };
}

const typemap: TypeMap<ColumnTypes> = {
  blob: identity("BLOB"),
  boolean: identity("BOOLEAN"),
  datetime: identity("DATE"),
  f32: identity("NUMBER"),
  f64: identity("NUMBER"),
  i128: identity("BIGINT"),
  i16: identity("NUMBER"),
  i32: identity("NUMBER"),
  i64: identity("BIGINT"),
  i8: identity("NUMBER"),
  json: identity("JSON"),
  string: identity("STRING"),
  time: identity("STRING"),
  u128: identity("BIGINT"),
  u16: identity("NUMBER"),
  u32: identity("NUMBER"),
  u64: identity("BIGINT"),
  u8: identity("NUMBER"),
  url: identity("URL"),
  uuid: identity("STRING"),
  uuid_v4: identity("STRING"),
  uuid_v7: identity("STRING"),
};

export default typemap;
