import normalize from "#normalize";
import type NormalizeSchema from "#NormalizeSchema";
import ObjectType from "#ObjectType";
import type Parsed from "#Parsed";
import type Schema from "#Schema";
import type { Dict, EmptyDict } from "@rcompat/type";

type NormalizeProps<S extends Dict<Schema>> =
  keyof S extends never
  ? EmptyDict
  : { [K in keyof S]: NormalizeSchema<S[K]> };

function vanilla<
  P extends Dict<Schema> = Dict<Schema>,
>(properties: P): ObjectType<NormalizeProps<P>>;
function vanilla(properties: Dict<Schema>) {
  const props: Dict<Parsed<unknown>> = {};
  for (const [k, v] of Object.entries(properties)) {
    props[k] = normalize(v as Schema);
  }
  return new ObjectType(props);
}

function loose<
  P extends Dict<Schema> = Dict<Schema>,
>(properties: P): ObjectType<NormalizeProps<P>, true>;
function loose(properties: Dict<Schema>) {
  const props: Dict<Parsed<unknown>> = {};
  for (const [k, v] of Object.entries(properties)) {
    props[k] = normalize(v as Schema);
  }
  return new ObjectType(props, true);
}

function strict<
  P extends Dict<Schema> = Dict<Schema>,
>(properties: P): ObjectType<NormalizeProps<P>, false>;
function strict(properties: Dict<Schema>) {
  const props: Dict<Parsed<unknown>> = {};
  for (const [k, v] of Object.entries(properties)) {
    props[k] = normalize(v as Schema);
  }
  return new ObjectType(props, false);
}

const object = { vanilla, loose, strict };

export default object;
