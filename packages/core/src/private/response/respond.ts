import AppError from "#AppError";
import binary from "#response/binary";
import json from "#response/json";
import redirect from "#response/redirect";
import type ResponseFunction from "#response/ResponseFunction";
import type ResponseLike from "#response/ResponseLike";
import text from "#response/text";
import s_streamable from "@rcompat/fs/s_streamable";
import Status from "@rcompat/http/Status";
import proper from "@rcompat/record/proper";
import type UnknownFunction from "@rcompat/type/UnknownFunction";

function invalid_body(body: string) {
  throw new AppError("invalid body {0} returned from route", body);
}

type Constructor<T> = { new(...args: never): T };
type Streamable<T> = { stream: () => ReadableStream<T> };

const is_instance = <T>(of: Constructor<T>) => ((value: unknown): value is T => value instanceof of);
const is_response = is_instance(Response);
const is_streamable =
  (value: unknown): value is Streamable<unknown> => value instanceof Blob || (value as Record<PropertyKey, unknown>)?.streamable === s_streamable;
const is_url = is_instance(URL);
const is_readablestream = is_instance(ReadableStream);
const is_null = (value: unknown): value is null => value === null;

type MatchResult<T extends ReadonlyArray<UnknownFunction>> = {
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

function match<T extends ReadonlyArray<UnknownFunction>>(m: MatchResult<T>): MatchResult<T> {
  return m;
}
// [if, then]
const guesses = match([
  [is_null, () => () => new Response(null, { status: Status.NO_CONTENT })],
  [is_url, value => redirect(value.toString())],
  [is_streamable, value => binary(value.stream())],
  [is_readablestream, binary],
  [(value: unknown) => is_response(value), value => _ => value],
  [proper, json],
  [(value: unknown) => typeof value === "string", text],
]);

const guess = (value: unknown): ResponseFunction | void =>
  guesses.find(([_if]) => _if(value))?.[1](value as never)
  ?? invalid_body(`${value}`);

export default (result: ResponseLike): ResponseFunction =>
  typeof result === "function" ? result : guess(result) as ResponseFunction;
