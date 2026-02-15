import type ColumnTypes from "#ColumnTypes";
import type { TypeMap } from "@primate/core/db";
import type { TypedArray } from "@rcompat/type";
import { Binary, Decimal128, ObjectId } from "mongodb";

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

function decimal() {
  return {
    bind(value: bigint) {
      return new Decimal128(value.toString());
    },
    column: "DECIMAL",
    unbind(value: Decimal128) {
      return BigInt(value.toString());
    },
  } as const;
}

const typemap: TypeMap<ColumnTypes> = {
  blob: {
    async bind(value) {
      const arrayBuffer = await value.arrayBuffer();
      return new Binary(new Uint8Array(arrayBuffer));
    },
    column: "BINARY",
    unbind(value) {
      return new Blob([value.toBits() as TypedArray],
        { type: "application/octet-stream" });
    },
  },
  boolean: identity("BOOLEAN"),
  datetime: identity("DATE"),
  f32: identity("DOUBLE"),
  f64: identity("DOUBLE"),
  i128: {
    bind(value) {
      return String(value);
    },
    column: "STRING",
    unbind(value) {
      return BigInt(value);
    },
  },
  i16: identity("INT"),
  i32: identity("INT"),
  i64: identity("LONG"),
  i8: identity("INT"),
  string: identity("STRING"),
  time: identity("TIME"),
  u128: {
    bind(value) {
      return String(value);
    },
    column: "STRING",
    unbind(value) {
      return BigInt(value);
    },
  },
  u16: identity("INT"),
  u32: identity("INT"),
  u64: decimal(),
  u8: identity("INT"),
  url: {
    bind(value) {
      return value.toString();
    },
    column: "STRING",
    unbind(value) {
      return new URL(value);
    },
  },
};

export default typemap;
