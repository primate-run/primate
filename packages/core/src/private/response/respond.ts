import E from "#errors";
import binary from "#response/binary";
import json from "#response/json";
import redirect from "#response/redirect";
import type ResponseFunction from "#response/ResponseFunction";
import type ResponseLike from "#response/ResponseLike";
import text from "#response/text";
import Streamable from "@rcompat/fs/Streamable";
import { Status } from "@rcompat/http";
import is from "@rcompat/is";
import type { UnknownFunction } from "@rcompat/type";

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
  [is.null, () => () => new Response(null, { status: Status.NO_CONTENT })],
  [is.url, value => redirect(value.toString())],
  [Streamable.is, value => binary(value)],
  [is.response, value => _ => value],
  [is.dict, json],
  [is.array, json],
  [is.string, text],
]);

function guess(value: unknown): ResponseFunction | void {
  const found = guesses.find(([_if]) => _if(value))?.[1](value as never);
  if (found === undefined) throw E.response_invalid_body(`${value}`);
  return found;
};

export default (result: ResponseLike): ResponseFunction =>
  typeof result === "function" ? result : guess(result) as ResponseFunction;
