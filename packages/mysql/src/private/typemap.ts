import type ColumnTypes from "#ColumnTypes";
import type { TypeMap } from "@primate/core/db";
import is from "@rcompat/is";

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
    column: "BOOL",
    unbind(value) {
      return Number(value) === 1;
    },
  },
  datetime: identity("DATETIME(3)"),
  f32: identity("DOUBLE"),
  f64: identity("DOUBLE"),
  i128: {
    bind(value) {
      return String(value);
    },
    column: "DECIMAL(39, 0)",
    unbind(value) {
      return BigInt(value);
    },
  },
  i16: number("SMALLINT"),
  i32: number("INT"),
  i64: {
    bind(value) {
      return String(value);
    },
    column: "BIGINT",
    unbind(value) {
      return BigInt(value);
    },
  },
  i8: number("TINYINT"),
  /*primary: {
    bind(value) {
      if (is.numeric(value)) return Number(value);
      throw new Error(`\`${value}\` is not a valid primary key value`);
    },
    column: "INT NOT NULL AUTO_INCREMENT PRIMARY KEY",
    unbind(value) {
      return String(value);
    },
  },*/
  string: identity("TEXT"),
  time: identity("TEXT"),
  u128: {
    bind(value) {
      return String(value);
    },
    column: "DECIMAL(39, 0)",
    unbind(value) {
      return BigInt(value);
    },
  },
  u16: number("SMALLINT UNSIGNED"),
  u32: number("INT UNSIGNED"),
  u64: {
    bind(value) {
      return String(value);
    },
    column: "BIGINT UNSIGNED",
    unbind(value) {
      return BigInt(value);
    },
  },
  u8: number("TINYINT UNSIGNED"),
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
