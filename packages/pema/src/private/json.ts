import type { ParsedJSON } from "#JSONType";
import JSONType from "#JSONType";

// overload 1: no schema -> JSONValue
export default function json(): JSONType<undefined>;
// overload 2: schema -> strongly typed
export default function json<S extends ParsedJSON>(inner: S): JSONType<S>;
export default function json(inner?: any) {
  return new JSONType(inner);
}

