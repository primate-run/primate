import numeric from "@rcompat/assert/numeric";
import type MaybePromise from "@rcompat/type/MaybePromise";
import type DataType from "pema/DataType";
import type PrimitiveParam from "@rcompat/sqlite/PrimitiveParam";

type TypeDescriptor<T extends keyof DataType> = {
  type: string;
  in: (value: DataType[T]) => MaybePromise<PrimitiveParam>;
  out: (value: unknown) => DataType[T];
};

type TypeMap = {
  [K in keyof DataType]: TypeDescriptor<K>;
};

function ident<T extends PrimitiveParam>(type: string) {
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

const number = {
  type: "number",
  in(value: number) {
    return BigInt(value);
  },
  out(value: unknown) {
    return Number(value as bigint);
  },
};

const types: TypeMap = {
  blob: {
    type: "blob",
    async in(value) {
      const arrayBuffer = await value.arrayBuffer();
      return new Uint8Array(arrayBuffer);
    },
    out(value) {
      return new Blob([value as Uint8Array],
        { type: "application/octet-stream" });
    },
  },
  //ident<Uint8Array>("blob"),
  boolean: {
    type: "integer",
    in(value) {
      return value === true ? 1 : 0;
    },
    out(value) {
      // out: find/get currently set statement.safeIntegers(true);
      return Number(value) === 1;
    },
  },
  datetime: {
    type: "text",
    in(value) {
      return value.toJSON();
    },
    out(value) {
      return new Date(value as string);
    },
  },
  f32: ident<number>("real"),
  f64: ident<number>("real"),
  string: ident<string>("text"),
  i8: number,
  i16: number,
  i32: number,
  i64: ident<bigint>("integer"),
  i128: ident<any>("-"),
  primary: {
    type: "integer primary key",
    in(value: string) {
      if (numeric(value)) {
        return Number(value);
      }
      throw new Error(`\`${value}\` is not a valid primary key value`);
    },
    out(value: unknown) {
      return String(value as bigint);
    },
  },
  time: {
    type: "text",
    in(value) {
      return value.toJSON();
    },
    out(value) {
      return new Date(value as string);
    },
  },
  u8: number,
  u16: number,
  u32: number,
  u64: ident<bigint>("integer"),
  u128: ident<any>("-"),
};

export default (value: keyof typeof types) => types[value];
