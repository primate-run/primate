export type { default as ArrayType } from "#ArrayType";
export type { default as BooleanType } from "#BooleanType";
export type { default as ConstructorType } from "#ConstructorType";
export type { default as DataKey } from "#DataKey";
export type { default as DataType } from "#DataType";
export type { default as DefaultType } from "#DefaultType";
export type { default as EnumType } from "#EnumType";
export type { default as FunctionType } from "#FunctionType";
export type { default as Id } from "#Id";
export type { default as InferStore } from "#InferStore";
export type { default as InferStoreOut } from "#InferStoreOut";
export type { default as Issue } from "#Issue";
export type { default as IsType } from "#IsType";
export type { default as JSONPayload } from "#json/JSONPayload";
export type { default as LiteralType } from "#LiteralType";
export type {
  default as NormalizeSchema,
  NormalizeSchemaObject,
} from "#NormalizeSchema";
export type { default as NullType } from "#NullType";
export type { default as NumberType } from "#NumberType";
export type { default as ObjectType } from "#ObjectType";
export type { default as OptionalType } from "#OptionalType";
export type { default as Parsed } from "#Parsed";
export type { default as PureType } from "#PureType";
export type { default as RecordType } from "#RecordType";
export type { default as Schema } from "#Schema";
export type { default as Serialized } from "#Serialized";
export type { default as Storable } from "#Storable";
export type { default as StoreId } from "#StoreId";
export type { default as StoreSchema } from "#StoreSchema";
export type { default as StringType } from "#StringType";
export type { default as TupleType } from "#TupleType";
export type { default as UintType } from "#UintType";
export type { default as UndefinedType } from "#UndefinedType";
export type { default as UnionType } from "#UnionType";
export type { default as UnknownType } from "#UnknownType";
export type { default as UUIDType } from "#UUIDType";
export type { default as UUIDV4Type } from "#UUIDV4Type";
export type { default as UUIDV7Type } from "#UUIDV7Type";

import array from "#array";
import bigint from "#bigint";
import biguint from "#biguint";
import blob from "#blob";
import boolean from "#boolean";
import constructor from "#constructor";
import date from "#date";
import dict from "#dict";
import enum_ from "#enum";
import f32 from "#f32";
import f64 from "#f64";
import file from "#file";
import fn from "#function";
import i128 from "#i128";
import i16 from "#i16";
import i32 from "#i32";
import i64 from "#i64";
import i8 from "#i8";
import int from "#int";
import is from "#is";
import json from "#json";
import normalize from "#normalize";
import type NormalizeSchema from "#NormalizeSchema";
import number from "#number";
import object from "#object";
import omit from "#omit";
import pure from "#pure";
import record from "#record";
import type Schema from "#Schema";
import string from "#string";
import symbol from "#symbol";
import tuple from "#tuple";
import u128 from "#u128";
import u16 from "#u16";
import u32 from "#u32";
import u64 from "#u64";
import u8 from "#u8";
import uint from "#uint";
import union from "#union";
import unknown from "#unknown";
import url from "#url";
import uuid from "#uuid";

/**
* Create a schema.
*/
function schema<const S extends Schema>(s: S): NormalizeSchema<S> {
  return normalize(s);
}

schema.array = array;
schema.bigint = bigint;
schema.biguint = biguint;
schema.blob = blob;
schema.boolean = boolean;
schema.constructor = constructor;
schema.date = date;
schema.dict = dict;
schema.enum = enum_;
schema.f32 = f32;
schema.f64 = f64;
schema.file = file;
schema.function = fn;
schema.i128 = i128;
schema.i16 = i16;
schema.i32 = i32;
schema.i64 = i64;
schema.i8 = i8;
schema.int = int;
schema.is = is;
schema.json = json;
schema.number = number;
schema.object = object;
schema.omit = omit;
schema.record = record;
schema.pure = pure;
schema.string = string;
schema.symbol = symbol;
schema.tuple = tuple;
schema.u128 = u128;
schema.u16 = u16;
schema.u32 = u32;
schema.u64 = u64;
schema.u8 = u8;
schema.uint = uint;
schema.union = union;
schema.unknown = unknown;
schema.url = url;
schema.uuid = uuid;

export default schema;

