import type ColumnTypes from "#ColumnTypes";
import type TypeMap from "@primate/core/db/TypeMap";

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
    bind: value => value,
    unbind: value => Number(value),
  };
}

const typemap: TypeMap<ColumnTypes> = {
  blob: {
    column: "BYTEA",
    async bind(value) {
      const arrayBuffer = await value.arrayBuffer();
      return new Uint8Array(arrayBuffer);
    },
    unbind(value) {
      return new Blob([value], { type: "application/octet-stream" });
    },
  },
  boolean: identity("BOOLEAN"),
  datetime: identity("TIMESTAMP"),
  f32: identity("REAL"),
  f64: identity("FLOAT8"),
  string: identity("TEXT"),
  i8: number("SMALLINT"),
  i16: number("SMALLINT"),
  i32: number("INTEGER"),
  i64: {
    column: "BIGINT",
    bind(value) {
      return String(value);
    },
    unbind(value) {
      return BigInt(value);
    },
  },
  i128: {
    column: "NUMERIC(39, 0)",
    bind(value) {
      return String(value);
    },
    unbind(value) {
      return BigInt(value);
    },
  },
  primary: {
    column: "SERIAL PRIMARY KEY",
    bind(value) {
      if (typeof value === "string" && Number.isInteger(+value)) {
        return Number(value);
      }
      throw new Error(`\`${value}\` is not a valid primary key value`);
    },
    unbind(value) {
      return String(value);
    },
  },
  u8: number("SMALLINT"),
  u16: number("INTEGER"),
  u32: {
    column: "BIGINT",
    bind(value) {
      return String(value);
    },
    unbind(value) {
      return Number(value);
    },
  },
  u64: {
    column: "NUMERIC(20, 0)",
    bind(value) {
      return String(value);
    },
    unbind(value) {
      return BigInt(value);
    },
  },
  u128: {
    column: "NUMERIC(39, 0)",
    bind(value) {
      return String(value);
    },
    unbind(value) {
      return BigInt(value);
    },
  },
  time: identity("TIME"),
};

export default typemap;
