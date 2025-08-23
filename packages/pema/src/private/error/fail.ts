import ParseError from "#ParseError";

export default function fail(input: unknown, msg: string) {
  return new ParseError([{ input, message: msg, path: "" }]);
}
