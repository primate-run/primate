import { BadBody } from "@primate/core/errors";
import json from "@primate/core/handler/json";
import redirect from "@primate/core/handler/redirect";
import stream from "@primate/core/handler/stream";
import text from "@primate/core/handler/text";
import streamable from "@rcompat/fs/streamable";
import identity from "@rcompat/function/identity";
import proper from "@rcompat/object/proper";

const not_found = value => BadBody.throw(value);
const is_text = value => typeof value === "string";
const is_instance = of => value => value instanceof of;
const is_response = is_instance(globalThis.Response);
const is_fake_response = is_instance(Response);
const is_streamable =
  value => value instanceof Blob || value?.streamable === streamable;

// [if, then]
const guesses = [
  [is_instance(URL), redirect],
  [is_streamable, value => stream(value.stream())],
  [is_instance(ReadableStream), stream],
  [value => is_response(value) || is_fake_response(value), value => _ => value],
  [proper, json],
  [is_text, text],
  [not_found, identity],
];

const guess = value => guesses.find(([check]) => check(value))?.[1](value);

export default result => typeof result === "function" ? result : guess(result);
