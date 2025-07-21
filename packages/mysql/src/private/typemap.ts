import numeric from "@rcompat/assert/numeric";
import type MaybePromise from "@rcompat/type/MaybePromise";
import type DataType from "pema/DataType";

type TypeDescriptor<T extends keyof DataType> = {
  type: string;
  in: (value: DataType[T]) => MaybePromise<unknown>;
  out: (value: unknown) => DataType[T];
};

type TypeMap = {
  [K in keyof DataType]: TypeDescriptor<K>;
};

function ident<T>(type: string) {
  return {
    type,
    in(value: T) {
      return value;
    },
    out(value: unknown) {
      return value as T;
    },
  };
}

const types: TypeMap = {
  blob: {
    type: "BLOB",
    async in(value) {
      const arrayBuffer = await value.arrayBuffer();
      return new Uint8Array(arrayBuffer);
    },
    out(value) {
      return new Blob([value as Uint8Array],
        { type: "application/octet-stream" });
    },
  },
  boolean: {
    type: "BOOL",
    in(value) {
      return value === true ? 1 : 0;
    },
    out(value) {
      return Number(value) === 1;
    },
  },
  datetime: {
    type: "DATETIME(3)",
    in(value) {
      return value;
    },
    out(value) {
      return new Date(value as string);
    },
  },
  f32: ident<number>("DOUBLE"),
  f64: ident<number>("DOUBLE"),
  string: ident<string>("TEXT"),
  i8: ident<number>("TINYINT"),
  i16: ident<number>("SMALLINT"),
  i32: ident<number>("INT"),
  i64: {
    type: "BIGINT",
    in(value: bigint) {
      return String(value);
    },
    out(value: unknown) {
      return BigInt(value as string);
    },
  },
  i128: {
    type: "DECIMAL(39, 0)",
    in(value: bigint) {
      return String(value);
    },
    out(value: unknown) {
      return BigInt(value as string);
    },
  },
  primary: {
    type: "INT NOT NULL AUTO_INCREMENT PRIMARY KEY",
    in(value: string) {
      if (numeric(value)) {
        return Number(value);
      }
      throw new Error(`\`${value}\` is not a valid primary key value`);
    },
    out(value: unknown) {
      return String(value as number);
    },
  },
  time: {
    type: "TIME",
    in(value) {
      return value.toISOString().slice(11, 19);
    },
    out(value) {
      return new Date(value as string);
    },
  },
  u8: ident<number>("TINYINT UNSIGNED"),
  u16: ident<number>("SMALLINT UNSIGNED"),
  u32: ident<number>("INT UNSIGNED"),
  u64: {
    type: "BIGINT UNSIGNED",
    in(value: bigint) {
      return String(value);
    },
    out(value: unknown) {
      return BigInt(value as string);
    },
  },
  u128: {
    type: "DECIMAL(39, 0)",
    in(value: bigint) {
      return String(value);
    },
    out(value: unknown) {
      return BigInt(value as string);
    },
  },
};

export default (value: keyof typeof types) => types[value];
