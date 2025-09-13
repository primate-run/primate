import normalize from "#normalize";
import type NormalizeSchema from "#NormalizeSchema";
import type Schema from "#Schema";

/**
* Create a schema.
*/
export default function schema<const S extends Schema>(s: S): NormalizeSchema<S> {
  return normalize(s);
}
