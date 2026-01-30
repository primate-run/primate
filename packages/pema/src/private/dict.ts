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
export default function dict(): RecordType<StringType, StringType>;
export default function dict<const Value extends Parsed<unknown>>(
  of: Value,
): RecordType<StringType, Value>;
export default function dict(of = string) {
  return record(string, of);
}
