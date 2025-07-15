import type ArrayType from "#ArrayType";
import type DecrementDepth from "#DecrementDepth";
import type DefaultType from "#DefaultType";
import type Infer from "#Infer";
import type NullType from "#NullType";
import type Schema from "#Schema";
import type TupleType from "#TupleType";
import type UndefinedType from "#UndefinedType";
import type Validated from "#Validated";
import type ImpliedOptional from "@rcompat/type/ImpliedOptional";
import type UndefinedToOptional from "@rcompat/type/UndefinedToOptional";

type InferInputSchema<S, Depth extends number = 3> =
  [Depth] extends [never] ? never :
    S extends DefaultType<infer _, unknown> ? Infer<_> | undefined :
      S extends Validated<unknown> ? Infer<S> :
        S extends null ? Infer<NullType> :
          S extends undefined ? Infer<UndefinedType> :
            S extends [infer Only] ?
              Only extends Validated<unknown> ? Infer<ArrayType<Only>> : never :
              S extends Schema[] ? InferInputSchema<TupleType<{
                [K in keyof S]: S[K] extends Validated<unknown>
                  ? InferInputSchema<S[K], DecrementDepth[Depth]>
                  : never
              }>> :
                S extends { [key: string]: Schema } ? ImpliedOptional<UndefinedToOptional<{
                  [K in keyof S]: InferInputSchema<S[K], DecrementDepth[Depth]>
                }>> :
                  never;

export type { InferInputSchema as default };
