import type ArrayType from "#ArrayType";
import type ConstructorType from "#ConstructorType";
import type LiteralType from "#LiteralType";
import type NullType from "#NullType";
import type Schema from "#Schema";
import type TupleType from "#TupleType";
import type UndefinedType from "#UndefinedType";
import type Validated from "#Validated";
import type AbstractConstructor from "@rcompat/type/AbstractConstructor";

type NormalizeSchema<S> =
  S extends [] ? TupleType<[]> :
    S extends Validated<unknown> ? S :
      S extends null ? NullType :
        S extends undefined ? UndefinedType :
          S extends AbstractConstructor ? ConstructorType<S> :
            S extends string ? LiteralType<S> :
              S extends [infer O] ?
                O extends Validated<unknown> ? ArrayType<NormalizeSchema<O>> : never :
                S extends Schema[] ? TupleType<S> :
                  S extends { [K: string]: Schema } ? {
                    -readonly [K in keyof S]: NormalizeSchema<S[K]>;
                  } :
                    never;

export type { NormalizeSchema as default };
