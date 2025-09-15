
import type ArrayType from "#ArrayType";
import type ConstructorType from "#ConstructorType";
import type LiteralType from "#LiteralType";
import type NullType from "#NullType";
import type ObjectType from "#ObjectType";
import type Parsed from "#Parsed";
import type Schema from "#Schema";
import type TupleType from "#TupleType";
import type UndefinedType from "#UndefinedType";
import type AbstractNewable from "@rcompat/type/AbstractNewable";
import type EO from "@rcompat/type/EO";

type IsEmptyObject<T> = keyof T extends never ? true : false;

type NormalizeSchemaArray<T extends Schema[]> =
  { [K in keyof T]: NormalizeSchema<T[K]> };

type NormalizeSchemaObject<T extends Record<string, unknown>> =
  IsEmptyObject<T> extends true
  ? EO
  : {
    -readonly [K in keyof T]: T[K] extends Parsed<unknown> ? T[K] : NormalizeSchema<T[K]>
  };

type NormalizeSchema<S> =
  S extends Parsed<unknown> ? S :
  S extends null ? NullType :
  S extends undefined ? UndefinedType :
  S extends string ? LiteralType<S> :
  S extends number ? LiteralType<S> :
  S extends boolean ? LiteralType<S> :
  S extends AbstractNewable ? ConstructorType<S> :
  S extends [infer O] ? O extends Schema ?
  ArrayType<NormalizeSchema<O>> : never :
  S extends Schema[] ? TupleType<NormalizeSchemaArray<S>> :
  S extends Record<string, unknown> ? ObjectType<NormalizeSchemaObject<S>> :
  never
  ;

export type { NormalizeSchema as default };
