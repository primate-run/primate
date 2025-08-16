import type ColumnTypes from "#ColumnTypes";
import type TypeMap from "@primate/core/database/TypeMap";

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
    bind: value => value,
    column,
    unbind: value => Number(value),
  };
}

const typemap: TypeMap<ColumnTypes> = {
  blob: {
    async bind(value) {
      const arrayBuffer = await value.arrayBuffer();
      return new Uint8Array(arrayBuffer);
    },
    column: "BYTEA",
    unbind(value) {
      return new Blob([value], { type: "application/octet-stream" });
    },
  },
  boolean: identity("BOOLEAN"),
  datetime: identity("TIMESTAMP"),
  f32: identity("REAL"),
  f64: identity("FLOAT8"),
  i128: {
    bind(value) {
      return String(value);
    },
    column: "NUMERIC(39, 0)",
    unbind(value) {
      return BigInt(value);
    },
  },
  i16: number("SMALLINT"),
  i32: number("INTEGER"),
  i64: {
    bind(value) {
      return String(value);
    },
    column: "BIGINT",
    unbind(value) {
      return BigInt(value);
    },
  },
  i8: number("SMALLINT"),
  primary: {
    bind(value) {
      if (typeof value === "string" && Number.isInteger(+value)) {
        return Number(value);
      }
      throw new Error(`\`${value}\` is not a valid primary key value`);
    },
    column: "SERIAL PRIMARY KEY",
    unbind(value) {
      return String(value);
    },
  },
  string: identity("TEXT"),
  time: identity("TIME"),
  u128: {
    bind(value) {
      return String(value);
    },
    column: "NUMERIC(39, 0)",
    unbind(value) {
      return BigInt(value);
    },
  },
  u16: number("INTEGER"),
  u32: {
    bind(value) {
      return String(value);
    },
    column: "BIGINT",
    unbind(value) {
      return Number(value);
    },
  },
  u64: {
    bind(value) {
      return String(value);
    },
    column: "NUMERIC(20, 0)",
    unbind(value) {
      return BigInt(value);
    },
  },
  u8: number("SMALLINT"),
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
