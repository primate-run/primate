import numeric from "@rcompat/assert/numeric";
import type TypeMap from "@primate/core/db/TypeMap";
import type ColumnTypes from "#ColumnTypes";

function identity<C extends keyof ColumnTypes>(column: C): {
  column: C;
  bind: (value: ColumnTypes[C]) => ColumnTypes[C];
  unbind: (value: ColumnTypes[C]) => ColumnTypes[C];
} {
  return {
    column,
    bind: value => value,
    unbind: value => value,
  };
}

function number<C extends keyof ColumnTypes>(column: C): {
  column: C;
  bind: (value: number) => number;
  unbind: (value: ColumnTypes[C]) => number;
} {
  return {
    column,
    bind: (value) => value,
    unbind: (value) => Number(value),
  };
}
const typemap: TypeMap<ColumnTypes> = {
  blob: {
    column: "BLOB",
    async bind(value) {
      const arrayBuffer = await value.arrayBuffer();
      return new Uint8Array(arrayBuffer);
    },
    unbind(value) {
      return new Blob([value], { type: "application/octet-stream" });
    },
  },
  boolean: {
    column: "INTEGER",
    bind(value) {
      return value === true ? 1 : 0;
    },
    unbind(value) {
      return Number(value) === 1;
    },
  },
  datetime: {
    column: "TEXT",
    bind(value)  {
      return value.toJSON();
    },
    unbind(value) {
      return new Date(value);
    },
  },
  f32: identity("REAL"),
  f64: identity("REAL"),
  string: identity("TEXT"),
  i8: number("INTEGER"),
  i16: number("INTEGER"),
  i32: number("INTEGER"),
  i64: {
    column: "INTEGER",
    bind(value) {
      return value;
    },
    unbind(value) {
      return BigInt(value);
    },
  },
  i128: {
    column: "TEXT",
    bind(value) {
      return String(value);
    },
    unbind(value) {
      return BigInt(value);
    },
  },
  primary: {
    column: "INTEGER PRIMARY KEY",
    bind(value) {
      if (numeric(value)) {
        return Number(value);
      }
      throw new Error(`\`${value}\` is not a valid primary key value`);
    },
    unbind(value) {
      return String(value);
    },
  },
  time: identity("TEXT"),
  u8: number("INTEGER"),
  u16: number("INTEGER"),
  u32: number("INTEGER"),
  u64: {
    column: "TEXT",
    bind(value) {
      return String(value);
    },
    unbind(value) {
      return BigInt(value);
    },
  },
  u128: {
    column: "TEXT",
    bind(value) {
      return String(value);
    },
    unbind(value) {
      return BigInt(value);
    },
  },
};

export default typemap;
