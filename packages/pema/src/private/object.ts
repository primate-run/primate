import normalize from "#normalize";
import type NormalizeSchema from "#NormalizeSchema";
import ObjectType from "#ObjectType";
import type Schema from "#Schema";
import type Dict from "@rcompat/type/Dict";
import type EO from "@rcompat/type/EO";

type NormalizeProps<S extends Dict<Schema>> =
  keyof S extends never ? EO : { [K in keyof S]: NormalizeSchema<S[K]> };

export default function object<P extends Dict<Schema>>(properties: P):
  ObjectType<NormalizeProps<P>>;
export default function object(peries: Dict<Schema>) {
  const props: Dict<unknown> = {};
  for (const [k, v] of Object.entries(peries)) {
    props[k] = normalize(v as Schema);
  }
  return new ObjectType(props as any);
}
