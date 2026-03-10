import normalize from "#normalize";
import type NormalizeSchema from "#NormalizeSchema";
import ObjectType from "#ObjectType";
import type Parsed from "#Parsed";
import type Schema from "#Schema";
import type { Dict, EmptyObject } from "@rcompat/type";

type NormalizeProps<S extends Dict<Schema>> =
  keyof S extends never
  ? EmptyObject
  : { [K in keyof S]: NormalizeSchema<S[K]> };

export default function object<
  P extends Dict<Schema> = Dict<Schema>,
>(properties: P): ObjectType<NormalizeProps<P>>;
export default function object(properties: Dict<Schema>) {
  const props: Dict<Parsed<unknown>> = {};
  for (const [k, v] of Object.entries(properties)) {
    props[k] = normalize(v as Schema);
  }
  return new ObjectType(props);
}
