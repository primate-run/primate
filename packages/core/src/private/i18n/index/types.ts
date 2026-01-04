import type TypeOf from "#i18n/TypeOf";
import type { Dict } from "@rcompat/type";

type EntryOf<Body extends string> =
  Body extends `${infer Name}:${infer Spec}`
  ? { __name: Name & string; __type: TypeOf<Spec> }
  : { __name: Body & string; __type: string };

export type EntriesOf<S extends string> =
  S extends `${infer _}{${infer Body}}${infer Rest}`
  ? EntryOf<Body> | EntriesOf<Rest>
  : never;

export type ParamsFromEntries<E> =
  [E] extends [never] ? Dict : {
    [K in E as K extends { __name: infer N extends string } ? N : never]:
    K extends { __type: infer T } ? T : never
  };

type Join<A extends string, B extends string> = `${A}.${B}`;

type Prev = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

type Primitive = string | number | boolean | null | undefined;

export type DotPaths<T, D extends number = 7> =
  [D] extends [never] ? never :
  T extends Primitive ? never :
  T extends readonly (infer E)[] ?
  `${number}` | Join<`${number}`, DotPaths<E, Prev[D]>>
  : T extends object ?
  string extends keyof T ? string :
  {
    [K in Extract<keyof T, string>]:
    K | (
      DotPaths<T[K], Prev[D]> extends infer R
      ? R extends string ? Join<K, R> : never
      : never
    )
  }[Extract<keyof T, string>]
  : never;

export type PathValue<T, P extends string, D extends number = 7> =
  string extends P ? unknown :
  [D] extends [never] ? unknown :
  P extends `${infer Head}.${infer Tail}`
  ? Head extends `${number}`
  ? T extends readonly (infer E)[] ? PathValue<E, Tail, Prev[D]> : unknown
  : T extends object
  ? Head extends keyof T ? PathValue<T[Head], Tail, Prev[D]> : unknown
  : unknown
  : P extends `${number}`
  ? T extends readonly (infer E)[] ? E : unknown
  : T extends object
  ? (P extends keyof T ? T[P] : unknown)
  : unknown;
