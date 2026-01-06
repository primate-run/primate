import error from "#error";
import ParseError from "#ParseError";

export default function fail(...args: Parameters<typeof error>) {
  return new ParseError(error(...args));
}
