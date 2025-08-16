import type Parsed from "#Parsed";
import RecordType from "#RecordType";
import type RecordTypeKey from "#RecordTypeKey";

/**
* Value is a record of the given key and value types.
*/
export default <
  const Key extends RecordTypeKey,
  const Value extends Parsed<unknown>,
>(k: Key, v: Value) => new RecordType(k, v);
