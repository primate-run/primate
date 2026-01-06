import type DefaultType from "#DefaultType";
import type NormalizeSchema from "#NormalizeSchema";
import type ObjectType from "#ObjectType";
import type OptionalType from "#OptionalType";
import type Parsed from "#Parsed";
import type Schema from "#Schema";
import type { ImpliedOptional, UndefinedToOptional } from "@rcompat/type";

type InferInputSchema<S> =
  S extends DefaultType<infer T, unknown> ? T["infer"] | undefined :
  S extends OptionalType<infer T> ? T["infer"] | undefined :
  S extends ObjectType<infer P> ?
  ImpliedOptional<UndefinedToOptional<{
    [K in keyof P]: InferInputSchema<P[K]>
  }>> :
  S extends Parsed<unknown> ? S["infer"] :
  S extends { [key: string]: Schema } ?
  ImpliedOptional<UndefinedToOptional<{
    [K in keyof S]: InferInputSchema<S[K]>
  }>> :
  NormalizeSchema<S>["infer"];

export type { InferInputSchema as default };
