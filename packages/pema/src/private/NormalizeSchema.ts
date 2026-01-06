import type ArrayType from "#ArrayType";
import type ConstructorType from "#ConstructorType";
import type LiteralType from "#LiteralType";
import type NullType from "#NullType";
import type ObjectType from "#ObjectType";
import type Parsed from "#Parsed";
import type Schema from "#Schema";
import type TupleType from "#TupleType";
import type UndefinedType from "#UndefinedType";
import type { AbstractNewable } from "@rcompat/type";

type NormalizeSchemaArray<T extends Schema[]> =
  { [K in keyof T]: NormalizeSchema<T[K]> };

type NormalizeSchemaObject<T extends Record<string, unknown>> =
  { -readonly [K in keyof T]: NormalizeSchema<T[K]> };

type NormalizeSchema<S> =
  S extends Parsed<unknown> ? S :
  S extends null ? NullType :
  S extends undefined ? UndefinedType :
  S extends string | number | boolean ? LiteralType<S> :
  S extends AbstractNewable ? ConstructorType<S> :
  S extends [Schema] ? ArrayType<NormalizeSchema<S[0]>> :
  S extends Schema[] ? TupleType<NormalizeSchemaArray<S>> :
  S extends Record<string, unknown> ? ObjectType<NormalizeSchemaObject<S>> :
  never;

export type { NormalizeSchema as default };
