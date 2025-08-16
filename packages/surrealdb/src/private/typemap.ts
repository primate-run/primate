import type ColumnTypes from "#ColumnTypes";
import type TypeMap from "@primate/core/database/TypeMap";
import { RecordId } from "surrealdb";

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
  blob: {
    async bind(value) {
      const arrayBuffer = await value.arrayBuffer();
      return new Uint8Array(arrayBuffer);
    },
    column: "BINARY",
    unbind(value) {
      return new Blob([value], { type: "application/octet-stream" });
    },
  },
  boolean: identity("BOOL"),
  datetime: identity("DATETIME"),
  f32: identity("FLOAT"),
  f64: identity("FLOAT"),
  i128: {
    bind(value) {
      return String(value);
    },
    column: "STRING",
    unbind(value) {
      return BigInt(value);
    },
  },
  i16: {
    bind(value) {
      return BigInt(value);
    },
    column: "INT",
    unbind(value) {
      return Number(value);
    },
  },
  i32: {
    bind(value) {
      return BigInt(value);
    },
    column: "INT",
    unbind(value) {
      return Number(value);
    },
  },
  i64: identity("INT"),
  i8: {
    bind(value) {
      return BigInt(value);
    },
    column: "INT",
    unbind(value) {
      return Number(value);
    },
  },
  primary: {
    bind(value) {
      if (typeof value === "string") {
        const [tb, id] = value.split(":");
        return new RecordId(tb, id);
      }
      throw new Error(`\`${value}\` is not a valid primary key value`);
    },
    column: "PRIMARY",
    unbind(value) {
      return `${value.tb}:${value.id}`;
    },
  },
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
  u16: {
    bind(value) {
      return BigInt(value);
    },
    column: "INT",
    unbind(value) {
      return Number(value);
    },
  },
  u32: {
    bind(value) {
      return BigInt(value);
    },
    column: "INT",
    unbind(value) {
      return Number(value);
    },
  },
  u64: {
    bind(value) {
      return String(value);
    },
    column: "STRING",
    unbind(value) {
      return BigInt(value);
    },
  },
  u8: {
    bind(value) {
      return BigInt(value);
    },
    column: "INT",
    unbind(value) {
      return Number(value);
    },
  },
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
