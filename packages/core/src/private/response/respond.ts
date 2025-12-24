import fail from "#fail";
import binary from "#response/binary";
import json from "#response/json";
import redirect from "#response/redirect";
import type ResponseFunction from "#response/ResponseFunction";
import type ResponseLike from "#response/ResponseLike";
import text from "#response/text";
import dict from "@rcompat/dict";
import Streamable from "@rcompat/fs/Streamable";
import Status from "@rcompat/http/Status";
import type { Newable, UnknownFunction } from "@rcompat/type";

function invalid_body(body: string) {
  throw fail("invalid body {0} returned from route", body);
}

const is_instance = <T>(of: Newable<T>) =>
  ((value: unknown): value is T => value instanceof of);
const is_response = is_instance(Response);
const is_url = is_instance(URL);
const is_null = (value: unknown): value is null => value === null;

type ReadonlyFunctions = ReadonlyArray<UnknownFunction>;

type MatchResult<T extends ReadonlyFunctions> = {
  [K in keyof T]:
  readonly [
    T[K],
    T[K] extends (arg: unknown) => arg is infer R ?
    (arg: R) => ResponseFunction :
    T[K] extends (arg: unknown) => boolean ?
    (arg: unknown) => ResponseFunction :
    (...args: unknown[]) => unknown,
  ]
};

function match<T extends ReadonlyFunctions>(m: MatchResult<T>): MatchResult<T> {
  return m;
}
// [if, then]
const guesses = match([
  [is_null, () => () => new Response(null, { status: Status.NO_CONTENT })],
  [is_url, value => redirect(value.toString())],
  [Streamable.is, value => binary(value)],
  [(value: unknown) => is_response(value), value => _ => value],
  [dict.proper, json],
  [(value: unknown) => typeof value === "string", text],
]);

const guess = (value: unknown): ResponseFunction | void =>
  guesses.find(([_if]) => _if(value))?.[1](value as never)
  ?? invalid_body(`${value}`);

export default (result: ResponseLike): ResponseFunction =>
  typeof result === "function" ? result : guess(result) as ResponseFunction;
