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

function number<C extends keyof ColumnTypes>(column: C): {
  bind: (value: number) => number;
  column: C;
  unbind: (value: ColumnTypes[C]) => number;
} {
  return {
    bind: (value) => value,
    column,
    unbind: (value) => Number(value),
  };
}
const typemap: TypeMap<ColumnTypes> = {
  blob: {
    async bind(value) {
      return new Uint8Array(await value.arrayBuffer());
    },
    column: "BLOB",
    unbind(value) {
      return new Blob([value], { type: "application/octet-stream" });
    },
  },
  boolean: {
    bind(value) {
      return value === true ? 1 : 0;
    },
    column: "INTEGER",
    unbind(value) {
      return Number(value) === 1;
    },
  },
  datetime: {
    bind(value) {
      return value.toJSON();
    },
    column: "TEXT",
    unbind(value) {
      return new Date(value);
    },
  },
  f32: identity("REAL"),
  f64: identity("REAL"),
  i128: {
    bind(value) {
      return String(value);
    },
    column: "TEXT",
    unbind(value) {
      return BigInt(value);
    },
  },
  i16: number("INTEGER"),
  i32: number("INTEGER"),
  i64: {
    bind(value) {
      return value;
    },
    column: "INTEGER",
    unbind(value) {
      return BigInt(value);
    },
  },
  i8: number("INTEGER"),
  string: identity("TEXT"),
  time: identity("TEXT"),
  u128: {
    bind(value) {
      return String(value);
    },
    column: "TEXT",
    unbind(value) {
      return BigInt(value);
    },
  },
  u16: number("INTEGER"),
  u32: number("INTEGER"),
  u64: {
    bind(value) {
      return String(value);
    },
    column: "TEXT",
    unbind(value) {
      return BigInt(value);
    },
  },
  u8: number("INTEGER"),
  url: {
    bind(value) {
      return value.toString();
    },
    column: "TEXT",
    unbind(value) {
      return new URL(value);
    },
  },
};

export default typemap;
