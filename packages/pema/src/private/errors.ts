import ParsedKey from "#ParsedKey";
import ParseError from "#ParseError";
import type ParseOptions from "#ParseOptions";
import is from "@rcompat/is";
import type { JSONPointer } from "@rcompat/type";

function print_got(x: unknown) {
  if (is.undefined(x)) return "undefined";
  if (is.null(x)) return "null";
  return `\`${x.toString()}\` (${typeof x})`;
}

function invalid_type(
  input: unknown,
  expected: string,
  options: ParseOptions<any> | JSONPointer = "") {
  const path = is.string(options) ? options : options[ParsedKey] ?? "";
  return new ParseError([{
    type: "invalid_type",
    input,
    message: `expected ${expected}, got ${print_got(input)}`,
    path,
  }]);
}

function invalid_format(
  input: unknown,
  message: string,
  path: JSONPointer = "") {
  return new ParseError([{
    type: "invalid_format",
    input,
    message,
    path,
  }]);
}

function too_small(input: unknown, message: string, path: JSONPointer = "") {
  return new ParseError([{ type: "too_small", input, message, path }]);
}

function too_large(input: unknown, message: string, path: JSONPointer = "") {
  return new ParseError([{ type: "too_large", input, message, path }]);
}

function out_of_range(input: unknown, message: string, path: JSONPointer = "") {
  return new ParseError([{ type: "out_of_range", input, message, path }]);
}

function duplicate(input: unknown, message: string, path: JSONPointer = "") {
  return new ParseError([{ type: "duplicate", input, message, path }]);
}

function not_in_set(input: unknown, message: string, path: JSONPointer = "") {
  return new ParseError([{ type: "not_in_set", input, message, path }]);
}

export default {
  invalid_type,
  invalid_format,
  too_small,
  too_large,
  out_of_range,
  duplicate,
  not_in_set,
};
