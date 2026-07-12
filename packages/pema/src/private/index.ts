import E from "#errors";

export type { default as ArrayType } from "#ArrayType";
export type { default as AsyncType } from "#AsyncType";
export type { default as BlobType } from "#BlobType";
export type { default as BooleanType } from "#BooleanType";
export type { default as ConstructorType } from "#ConstructorType";
export type { default as DataKey } from "#DataKey";
export type { default as DataType } from "#DataType";
export type { default as DateType } from "#DateType";
export type { default as DefaultType } from "#DefaultType";
export type { Enum, default as EnumType } from "#EnumType";
export type { default as FunctionType } from "#FunctionType";
export type { default as Id } from "#Id";
export type { default as InferStore } from "#InferStore";
export type { default as InferStoreOut } from "#InferStoreOut";
export type { default as Issue } from "#Issue";
export type { default as IsType } from "#IsType";
export type { default as JSONPayload } from "#json/JSONPayload";
export type { default as JSONType } from "#JSONType";
export type { default as LiteralType } from "#LiteralType";
export type {
  default as NormalizeSchema,
  NormalizeSchemaObject
} from "#NormalizeSchema";
export type { default as NullType } from "#NullType";
export type { default as NumberType } from "#NumberType";
export type { default as ObjectType } from "#ObjectType";
export type { default as OptionalType } from "#OptionalType";
export type { default as Parsed } from "#Parsed";
export type { default as PartialType } from "#PartialType";
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
export type { default as URLType } from "#URLType";
export type { default as UUIDType } from "#UUIDType";
export type { default as UUIDV4Type } from "#UUIDV4Type";
export type { default as UUIDV7Type } from "#UUIDV7Type";

import array from "#array";
import async_schema from "#async";
import bigint from "#bigint";
import biguint from "#biguint";
import blob from "#blob";
import boolean from "#boolean";
import constructor from "#constructor";
import date from "#date";
import dict from "#dict";
import enum$ from "#enum";
import f32 from "#f32";
import f64 from "#f64";
import file from "#file";
import function$ from "#function";
import i128 from "#i128";
import i16 from "#i16";
import i32 from "#i32";
import i64 from "#i64";
import i8 from "#i8";
import int from "#int";
import is from "#is";
import json from "#json";
import literal from "#literal";
import Loose from "#Loose";
import normalize from "#normalize";
import type NormalizeSchema from "#NormalizeSchema";
import null$ from "#null";
import number from "#number";
import object from "#object";
import omit from "#omit";
import partial from "#partial";
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
import undefined$ from "#undefined";
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

const loose = Object.assign(function loose<const S extends Schema>(s: S): NormalizeSchema<S> {
  const i = normalize(s);
  i[Loose] = true;
  return i;
}, {
  array: array.loose,
  bigint: bigint.loose,
  biguint: biguint.loose,
  blob: blob.loose,
  boolean: boolean.loose,
  constructor: constructor.loose,
  date: date.loose,
  dict: dict.loose,
  enum: enum$.loose,
  f32: f32.loose,
  f64: f64.loose,
  file: file.loose,
  function: function$.loose,
  i128: i128.loose,
  i16: i16.loose,
  i32: i32.loose,
  i64: i64.loose,
  i8: i8.loose,
  int: int.loose,
  is: is.loose,
  json: json.loose,
  literal: literal.loose,
  null: null$.loose,
  number: number.loose,
  object: object.loose,
  omit: omit.loose,
  record: record.loose,
  partial: partial.loose,
  pure: pure.loose,
  string: string.loose,
  symbol: symbol.loose,
  tuple: tuple.loose,
  u128: u128.loose,
  u16: u16.loose,
  u32: u32.loose,
  u64: u64.loose,
  u8: u8.loose,
  uint: uint.loose,
  undefined: undefined$.loose,
  union: union.loose,
  unknown: unknown.loose,
  url: url.loose,
  uuid: uuid.loose,
});

const strict = Object.assign(function strict<const S extends Schema>(s: S): NormalizeSchema<S> {
  const i = normalize(s);
  i[Loose] = false;
  return i;
}, {
  array: array.strict,
  bigint: bigint.strict,
  biguint: biguint.strict,
  blob: blob.strict,
  boolean: boolean.strict,
  constructor: constructor.strict,
  date: date.strict,
  dict: dict.strict,
  enum: enum$.strict,
  f32: f32.strict,
  f64: f64.strict,
  file: file.strict,
  function: function$.strict,
  i128: i128.strict,
  i16: i16.strict,
  i32: i32.strict,
  i64: i64.strict,
  i8: i8.strict,
  int: int.strict,
  is: is.strict,
  json: json.strict,
  literal: literal.strict,
  null: null$.strict,
  number: number.strict,
  object: object.strict,
  omit: omit.strict,
  record: record.strict,
  partial: partial.strict,
  pure: pure.strict,
  string: string.strict,
  symbol: symbol.strict,
  tuple: tuple.strict,
  u128: u128.strict,
  u16: u16.strict,
  u32: u32.strict,
  u64: u64.strict,
  u8: u8.strict,
  uint: uint.strict,
  undefined: undefined$.strict,
  union: union.strict,
  unknown: unknown.strict,
  url: url.strict,
  uuid: uuid.strict,
});

schema.array = array.vanilla;
schema.async = async_schema;
schema.bigint = bigint.vanilla;
schema.biguint = biguint.vanilla;
schema.blob = blob.vanilla;
schema.boolean = boolean.vanilla;
schema.constructor = constructor.vanilla;
schema.date = date.vanilla;
schema.dict = dict.vanilla;
schema.enum = enum$.vanilla;
schema.f32 = f32.vanilla;
schema.f64 = f64.vanilla;
schema.file = file.vanilla;
schema.function = function$.vanilla;
schema.i128 = i128.vanilla;
schema.i16 = i16.vanilla;
schema.i32 = i32.vanilla;
schema.i64 = i64.vanilla;
schema.i8 = i8.vanilla;
schema.int = int.vanilla;
schema.is = is.vanilla;
schema.json = json.vanilla;
schema.literal = literal.vanilla;
schema.null = null$.vanilla;
schema.number = number.vanilla;
schema.object = object.vanilla;
schema.omit = omit.vanilla;
schema.record = record.vanilla;
schema.partial = partial.vanilla;
schema.pure = pure.vanilla;
schema.string = string.vanilla;
schema.symbol = symbol.vanilla;
schema.tuple = tuple.vanilla;
schema.u128 = u128.vanilla;
schema.u16 = u16.vanilla;
schema.u32 = u32.vanilla;
schema.u64 = u64.vanilla;
schema.u8 = u8.vanilla;
schema.uint = uint.vanilla;
schema.undefined = undefined$.vanilla;
schema.union = union.vanilla;
schema.unknown = unknown.vanilla;
schema.url = url.vanilla;
schema.uuid = uuid.vanilla;
schema.error = E.field;

schema.loose = loose;
schema.strict = strict;

export default schema;
