import type Parsed from "#Parsed";
import type AbstractNewable from "@rcompat/type/AbstractNewable";

type Schema =
  | Parsed<unknown>
  | AbstractNewable
  | null
  | undefined
  | string
  | number
  | boolean
  | Schema[]
  | { [k: string]: Schema }
  ;

export type { Schema as default };
