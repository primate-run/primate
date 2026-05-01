import Loose from "#Loose";
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
>(properties: P): ObjectType<NormalizeProps<P>>;
function loose(properties: Dict<Schema>) {
  const props: Dict<Parsed<unknown>> = {};
  for (const [k, v] of Object.entries(properties)) {
    props[k] = normalize(v as Schema);
  }
  const i = new ObjectType(props);
  i[Loose] = true;
  return i;
}

function strict<
  P extends Dict<Schema> = Dict<Schema>,
>(properties: P): ObjectType<NormalizeProps<P>>;
function strict(properties: Dict<Schema>) {
  const props: Dict<Parsed<unknown>> = {};
  for (const [k, v] of Object.entries(properties)) {
    props[k] = normalize(v as Schema);
  }
  const i = new ObjectType(props);
  i[Loose] = false;
  return i;
}

const object = { vanilla, loose, strict };

export default object;
