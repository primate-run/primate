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

function uuid_to_bin(uuid: string): Uint8Array<ArrayBuffer> {
  return (Uint8Array as any).fromHex(uuid.replace(/-/g, ""));
}

function bin_to_uuid(buf: Uint8Array): string {
  const hex = (buf as any).toHex();
  const a = hex.slice(0, 8);
  const b = hex.slice(8, 12);
  const c = hex.slice(12, 16);
  const d = hex.slice(16, 20);
  const e = hex.slice(20);
  return `${a}-${b}-${c}-${d}-${e}`;
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
  json: {
    bind(value) {
      return JSON.stringify(value);
    },
    column: "JSON",
    unbind(value) {
      return JSON.parse(value);
    },
  },
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
  uuid: {
    bind: uuid_to_bin,
    column: "BINARY(16)",
    unbind: bin_to_uuid,
  },
  uuid_v4: {
    bind: uuid_to_bin,
    column: "BINARY(16)",
    unbind: bin_to_uuid,
  },
  uuid_v7: {
    bind: uuid_to_bin,
    column: "BINARY(16)",
    unbind: bin_to_uuid,
  },
};

export default typemap;
