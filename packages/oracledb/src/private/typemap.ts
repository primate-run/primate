import type ColumnTypes from "#ColumnTypes";
import type { TypeMap } from "@primate/core/db";
import oracledb from "oracledb";

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
    column: "BLOB",
    unbind(value) {
      return new Blob([value], { type: "application/octet-stream" });
    },
  },
  boolean: identity("BOOLEAN"),
  datetime: identity("TIMESTAMP"),
  f32: identity("BINARY_FLOAT"),
  f64: identity("BINARY_DOUBLE"),
  i8: number("NUMBER(3)"),
  i16: number("NUMBER(5)"),
  i32: number("NUMBER(10)"),
  i64: {
    bind(value) { return String(value); },
    column: "NUMBER(20)",
    unbind(value) { return BigInt(value as string); },
  },
  i128: {
    bind(value) { return String(value); },
    column: "VARCHAR2(40)",
    unbind(value) { return BigInt(value as string); },
  },
  u8: number("NUMBER(3)"),
  u16: number("NUMBER(5)"),
  u32: number("NUMBER(10)"),
  u64: {
    bind(value) { return String(value); },
    column: "NUMBER(20)",
    unbind(value) { return BigInt(value as string); },
  },
  u128: {
    bind(value) { return String(value); },
    column: "VARCHAR2(40)",
    unbind(value) { return BigInt(value as string); },
  },
  string: identity("VARCHAR2(4000)"),
  time: identity("VARCHAR2(4000)"),
  url: {
    bind(value) { return value.toString(); },
    column: "VARCHAR2(4000)",
    unbind(value) { return new URL(value as string); },
  },
  uuid: identity("VARCHAR2(36)"),
  uuid_v4: identity("VARCHAR2(36)"),
  uuid_v7: identity("VARCHAR2(36)"),
  json: {
    bind(value) {
      return { val: value, type: oracledb.DB_TYPE_JSON } as any;
    },
    column: "JSON",
    unbind(value) { return value; },
  },
};

export default typemap;
