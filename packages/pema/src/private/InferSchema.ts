import type ArrayType from "#ArrayType";
import type DecrementDepth from "#DecrementDepth";
import type Infer from "#Infer";
import type NullType from "#NullType";
import type Schema from "#Schema";
import type TupleType from "#TupleType";
import type UndefinedType from "#UndefinedType";
import type Validated from "#Validated";
import type UndefinedToOptional from "@rcompat/type/UndefinedToOptional";

type InferSchema<S, Depth extends number = 3> =
  [Depth] extends [never] ? never :
    S extends Validated<unknown> ? Infer<S> :
      S extends null ? Infer<NullType> :
        S extends undefined ? Infer<UndefinedType> :
          S extends [infer Only] ?
            Only extends Validated<unknown> ? Infer<ArrayType<Only>> : never :
            S extends Schema[] ? InferSchema<TupleType<{
              [K in keyof S]: S[K] extends Validated<unknown>
                ? InferSchema<S[K], DecrementDepth[Depth]>
                : never
            }>> :
              S extends { [key: string]: Schema } ? UndefinedToOptional<{
                [K in keyof S]: InferSchema<S[K], DecrementDepth[Depth]>
              }> :
                never;

export type { InferSchema as default };
