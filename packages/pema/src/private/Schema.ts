import type Parsed from "#Parsed";
import type AbstractNewable from "@rcompat/type/AbstractNewable";

type Schema =
  | { [k: string]: Schema }
  | AbstractNewable
  | null
  | Parsed<unknown>
  | Schema[]
  | string
  | undefined
  ;

export type { Schema as default };
