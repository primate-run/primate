import type Parsed from "#Parsed";
import record from "#record";
import type RecordType from "#RecordType";
import string from "#string";
import type StringType from "#StringType";

/**
 * Value is a dictionary (record with string keys) of the given type.
 *
 * @param of - The value type (defaults to p.string)
 */
function vanilla(): RecordType<StringType, StringType>;
function vanilla<const Value extends Parsed<unknown>>(
  of: Value,
): RecordType<StringType, Value>;
function vanilla(of = string.strict) {
  return record.vanilla(string.strict, of);
}

function loose(): RecordType<StringType, StringType, true>;
function loose<const Value extends Parsed<unknown>>(
  of: Value,
): RecordType<StringType, Value, true>;
function loose(of = string.loose) {
  return record.loose(string.loose, of);
}

function strict(): RecordType<StringType, StringType, false>;
function strict<const Value extends Parsed<unknown>>(
  of: Value,
): RecordType<StringType, Value, false>;
function strict(of = string.loose) {
  return record.strict(string.loose, of);
}

const dict = { vanilla, loose, strict };

export default dict;
