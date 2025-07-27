import type ColumnTypes from "#ColumnTypes";
import type TypeMap from "@primate/core/db/TypeMap";
import { Binary, Decimal128, ObjectId } from "mongodb";

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

function decimal() {
  return {
    column: "DECIMAL",
    bind(value: bigint) {
      return new Decimal128(value.toString());
    },
    unbind(value: Decimal128) {
      return BigInt(value.toString());
    },
  } as const;
}

const typemap: TypeMap<ColumnTypes> = {
  blob: {
    column: "BINARY",
    async bind(value) {
      const arrayBuffer = await value.arrayBuffer();
      return new Binary(new Uint8Array(arrayBuffer));
    },
    unbind(value) {
      return new Blob([value.toBits()], { type: "application/octet-stream" });
    },
  },
  boolean: identity("BOOLEAN"),
  datetime: identity("DATE"),
  f32: identity("DOUBLE"),
  f64: identity("DOUBLE"),
  string: identity("STRING"),
  i8: identity("INT"),
  i16: identity("INT"),
  i32: identity("INT"),
  i64: identity("LONG"),
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
        return new ObjectId(value);
      }
      throw new Error(`\`${value}\` is not a valid primary key value`);
    },
    unbind(value) {
      return String(value);
    },
  },
  u8: identity("INT"),
  u16: identity("INT"),
  u32: identity("INT"),
  u64: decimal(),
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
