import array from "#array";
import bigint from "#bigint";
import biguint from "#biguint";
import blob from "#blob";
import boolean from "#boolean";
import constructor from "#constructor";
import date from "#date";
import f32 from "#f32";
import f64 from "#f64";
import file from "#file";
import i128 from "#i128";
import i16 from "#i16";
import i32 from "#i32";
import i64 from "#i64";
import i8 from "#i8";
import int from "#int";
import normalize from "#normalize";
import type NormalizeSchema from "#NormalizeSchema";
import number from "#number";
import primary from "#primary";
import record from "#record";
import type Schema from "#Schema";
import string from "#string";
import symbol from "#symbol";
import u128 from "#u128";
import u16 from "#u16";
import u32 from "#u32";
import u64 from "#u64";
import u8 from "#u8";
import uint from "#uint";
import union from "#union";
import unknown from "#unknown";

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
schema.f32 = f32;
schema.f64 = f64;
schema.file = file;
schema.i128 = i128;
schema.i16 = i16;
schema.i32 = i32;
schema.i64 = i64;
schema.i8 = i8;
schema.int = int;
schema.number = number;
schema.record = record;
schema.primary = primary;
schema.string = string;
schema.symbol = symbol;
schema.u128 = u128;
schema.u16 = u16;
schema.u32 = u32;
schema.u64 = u64;
schema.u8 = u8;
schema.uint = uint;
schema.union = union;
schema.unknown = unknown;

export default schema;
