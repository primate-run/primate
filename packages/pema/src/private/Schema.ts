import type Validated from "#Validated";
import type AbstractConstructor from "@rcompat/type/AbstractConstructor";

type Schema =
  { [k: string]: Schema } |
  AbstractConstructor |
  null |
  Schema[] |
  string |
  undefined |
  Validated<unknown>;

export type { Schema as default };
