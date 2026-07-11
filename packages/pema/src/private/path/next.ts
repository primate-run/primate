import ParsedKey from "#ParsedKey";
import type ParseOptions from "#ParseOptions";
import join from "#path/join";
import is from "@rcompat/is";

function next(s: number | string, options?: ParseOptions): ParseOptions {
  const base = options?.[ParsedKey] ?? "";
  return is.undefined(options)
    ? { [ParsedKey]: join("", String(s)) }
    : { ...options, [ParsedKey]: join(base, String(s)) };
}

export default next;
