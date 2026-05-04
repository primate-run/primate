import type Parsed from "#Parsed";
import RecordType from "#RecordType";
import type RecordTypeKey from "#RecordTypeKey";

/**
* Value is a record of the given key and value types.
*/
const vanilla = <
  const Key extends RecordTypeKey,
  const Value extends Parsed<unknown>,
>(k: Key, v: Value) => new RecordType(k, v);

const loose = <
  const Key extends RecordTypeKey,
  const Value extends Parsed<unknown>,
>(k: Key, v: Value) => {
  return new RecordType(k, v, true);
};

const strict = <
  const Key extends RecordTypeKey,
  const Value extends Parsed<unknown>,
>(k: Key, v: Value) => {
  return new RecordType(k, v, false);
};

const record = { vanilla, loose, strict };

export default record;
