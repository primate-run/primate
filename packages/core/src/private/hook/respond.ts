import bad_body from "#error/bad-body";
import json from "#handler/json";
import redirect from "#handler/redirect";
import stream from "#handler/stream";
import text from "#handler/text";
import type ResponseFunction from "#ResponseFunction";
import type ResponseLike from "#ResponseLike";
import s_streamable from "@rcompat/fs/s_streamable";
import proper from "@rcompat/record/proper";
import type UnknownFunction from "@rcompat/type/UnknownFunction";

type Constructor<T> = { new (...args: never): T };
type Streamable<T> = { stream: () => ReadableStream<T> };

const is_instance = <T>(of: Constructor<T>) => ((value: unknown): value is T => value instanceof of);
const is_response = is_instance(Response);
const is_streamable =
  (value: unknown): value is Streamable<unknown> => value instanceof Blob || (value as Record<PropertyKey, unknown>)?.streamable === s_streamable;
const is_url = is_instance(URL);
const is_readablestream = is_instance(ReadableStream);

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
  [is_url, value => redirect(value.toString())],
  [is_streamable, value => stream(value.stream())],
  [is_readablestream, stream],
  [(value: unknown) => is_response(value), value => _ => value],
  [proper, json],
  [(value: unknown) => typeof value === "string", text],
]);

const guess = (value: unknown): ResponseFunction | void =>
  guesses.find(([_if]) => _if(value))?.[1](value as never) ?? bad_body(`${value}`);

export default (result: ResponseLike): ResponseFunction =>
  typeof result === "function" ? result : guess(result) as ResponseFunction;
