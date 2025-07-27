import type ColumnTypes from "#ColumnTypes";
import type TypeMap from "@primate/core/db/TypeMap";
import { RecordId } from "surrealdb";

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

const typemap: TypeMap<ColumnTypes> = {
  blob: {
    column: "BINARY",
    async bind(value) {
      const arrayBuffer = await value.arrayBuffer();
      return new Uint8Array(arrayBuffer);
    },
    unbind(value) {
      return new Blob([value], { type: "application/octet-stream" });
    },
  },
  boolean: identity("BOOL"),
  datetime: identity("DATETIME"),
  f32: identity("FLOAT"),
  f64: identity("FLOAT"),
  string: identity("STRING"),
  i8: {
    column: "INT",
    bind(value) {
      return BigInt(value);
    },
    unbind(value) {
      return Number(value);
    },
  },
  i16: {
    column: "INT",
    bind(value) {
      return BigInt(value);
    },
    unbind(value) {
      return Number(value);
    },
  },
  i32: {
    column: "INT",
    bind(value) {
      return BigInt(value);
    },
    unbind(value) {
      return Number(value);
    },
  },
  i64: identity("INT"),
  i128: {
    column: "STRING",
    bind(value) {
      return String(value);
    },
    unbind(value) {
      return BigInt(value);
    },
  },
  primary: {
    column: "PRIMARY",
    bind(value) {
      if (typeof value === "string") {
        const [tb, id] = value.split(":");
        return new RecordId(tb, id);
      }
      throw new Error(`\`${value}\` is not a valid primary key value`);
    },
    unbind(value) {
      return `${value.tb}:${value.id}`;
    },
  },
  u8: {
    column: "INT",
    bind(value) {
      return BigInt(value);
    },
    unbind(value) {
      return Number(value);
    },
  },
  u16: {
    column: "INT",
    bind(value) {
      return BigInt(value);
    },
    unbind(value) {
      return Number(value);
    },
  },
  u32: {
    column: "INT",
    bind(value) {
      return BigInt(value);
    },
    unbind(value) {
      return Number(value);
    },
  },
  u64: {
    column: "STRING",
    bind(value) {
      return String(value);
    },
    unbind(value) {
      return BigInt(value);
    },
  },
  u128: {
    column: "STRING",
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
