import type DB from "#db/DB";
import type { ArrayType, ObjectType, OptionalType, Parsed } from "pema";

export type SQLInput = ObjectType<any>;
export type SQLOutput = ArrayType<any>;

export type WordChar =
  | "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h" | "i" | "j" | "k" | "l" | "m"
  | "n" | "o" | "p" | "q" | "r" | "s" | "t" | "u" | "v" | "w" | "x" | "y" | "z"
  | "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L" | "M"
  | "N" | "O" | "P" | "Q" | "R" | "S" | "T" | "U" | "V" | "W" | "X" | "Y" | "Z"
  | "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "_";

export type ReadWord<S extends string, Acc extends string = ""> =
  S extends `${infer C extends WordChar}${infer Rest}`
  ? ReadWord<Rest, `${Acc}${C}`>
  : Acc;

export type ExtractPlaceholders<S extends string> =
  S extends `${string}:${infer After}`
  ? ReadWord<After> | ExtractPlaceholders<After>
  : never;

type RequiredKeys<I extends ObjectType<any>> = {
  [K in keyof I["properties"]]: I["properties"][K] extends OptionalType<any> ? never : K
}[keyof I["properties"]];

type MissingPlaceholders<I extends ObjectType<any>, Q extends string> =
  Exclude<RequiredKeys<I>, ExtractPlaceholders<Q>>;

export type CheckPlaceholders<I extends ObjectType<any>, Q extends string> =
  MissingPlaceholders<I, Q> extends never
  ? I
  : `Missing placeholders in query: ${MissingPlaceholders<I, Q> & string}`;

export default interface SQLDB<Client = unknown> extends DB<Client> {
  sql<
    Q extends string,
    I extends ObjectType<{ [K in ExtractPlaceholders<Q>]: Parsed<unknown> }> | undefined,
    O extends Parsed<unknown> | undefined,
  >(options: {
    input?: I extends ObjectType<any> ? CheckPlaceholders<I, Q> : I;
    query: Q;
    output?: O;
  }): (args: I extends ObjectType<any> ? I["infer"] : void)
      => Promise<O extends Parsed<unknown> ? O["infer"] : void>;
}
