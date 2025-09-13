import type ArrayType from "#ArrayType";
import type ConstructorType from "#ConstructorType";
import type LiteralType from "#LiteralType";
import type NullType from "#NullType";
import type Parsed from "#Parsed";
import type Schema from "#Schema";
import type TupleType from "#TupleType";
import type UndefinedType from "#UndefinedType";
import type AbstractNewable from "@rcompat/type/AbstractNewable";

type NormalizeSchema<S> =
  S extends [] ? TupleType<[]> :
  S extends Parsed<unknown> ? S :
  S extends null ? NullType :
  S extends undefined ? UndefinedType :
  S extends AbstractNewable ? ConstructorType<S> :
  S extends typeof LiteralType.Literal ? LiteralType<S> :
  S extends [infer O] ?
  O extends Parsed<unknown> ? ArrayType<NormalizeSchema<O>> : never :
  S extends Schema[] ? TupleType<S> :
  S extends { [K: string]: Schema } ? {
    -readonly [K in keyof S]: NormalizeSchema<S[K]>;
  } :
  never;

export type { NormalizeSchema as default };
