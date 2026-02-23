import JSONType from "#JSONType";
import type ObjectType from "#ObjectType";
import type Parsed from "#Parsed";
import type { Dict, JSONValue } from "@rcompat/type";

// overload 1: no schema -> JSONValue
export default function json(): JSONType<undefined>;
// overload 2: schema -> strongly typed
export default function json<S extends ObjectType<Dict<Parsed<JSONValue>>>>(inner: S): JSONType<S>;
export default function json(inner?: any) {
  return new JSONType(inner);
}
