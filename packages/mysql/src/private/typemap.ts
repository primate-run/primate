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
    column: "BOOL",
    bind(value) {
      return value === true ? 1 : 0;
    },
    unbind(value) {
      return Number(value) === 1;
    },
  },
  datetime: identity("DATETIME(3)"),
  f32: identity("DOUBLE"),
  f64: identity("DOUBLE"),
  string: identity("TEXT"),
  i8: number("TINYINT"),
  i16: number("SMALLINT"),
  i32: number("INT"),
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
    column: "DECIMAL(39, 0)",
    bind(value) {
      return String(value);
    },
    unbind(value) {
      return BigInt(value);
    },
  },
  primary: {
    column: "INT NOT NULL AUTO_INCREMENT PRIMARY KEY",
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
  u8: number("TINYINT UNSIGNED"),
  u16: number("SMALLINT UNSIGNED"),
  u32: number("INT UNSIGNED"),
  u64: {
    column: "BIGINT UNSIGNED",
    bind(value) {
      return String(value);
    },
    unbind(value) {
      return BigInt(value);
    },
  },
  u128: {
    column: "DECIMAL(39, 0)",
    bind(value) {
      return String(value);
    },
    unbind(value) {
      return BigInt(value);
    },
  },
};

export default typemap;
