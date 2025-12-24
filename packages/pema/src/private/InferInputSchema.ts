import type ArrayType from "#ArrayType";
import type DecrementDepth from "#DecrementDepth";
import type DefaultType from "#DefaultType";
import type Infer from "#Infer";
import type NullType from "#NullType";
import type ObjectType from "#ObjectType";
import type OptionalType from "#OptionalType";
import type Parsed from "#Parsed";
import type Schema from "#Schema";
import type TupleType from "#TupleType";
import type UndefinedType from "#UndefinedType";
import type { ImpliedOptional, UndefinedToOptional } from "@rcompat/type";

type InferInputSchema<S, Depth extends number = 3> =
  [Depth] extends [never] ? never :
  S extends DefaultType<infer T, unknown> ? Infer<T> | undefined :
  S extends OptionalType<infer T> ? Infer<T> | undefined :
  S extends ObjectType<infer P> ?
  ImpliedOptional<UndefinedToOptional<{
    [K in keyof P]: InferInputSchema<P[K], DecrementDepth[Depth]>
  }>> :
  S extends Parsed<unknown> ? Infer<S> :
  S extends null ? Infer<NullType> :
  S extends undefined ? Infer<UndefinedType> :
  S extends [infer Only] ?
  Only extends Parsed<unknown> ? Infer<ArrayType<Only>> : never :
  S extends Schema[] ? InferInputSchema<TupleType<{
    [K in keyof S]: S[K] extends Parsed<unknown>
    ? InferInputSchema<S[K], DecrementDepth[Depth]>
    : never
  }>> :
  S extends { [key: string]: Schema } ? ImpliedOptional<UndefinedToOptional<{
    [K in keyof S]: InferInputSchema<S[K], DecrementDepth[Depth]>
  }>> :
  never;

export type { InferInputSchema as default };
