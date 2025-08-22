import ParsedKey from "#ParsedKey";
import type ParseOptions from "#ParseOptions";
import join from "#path/join";

export default function next(s: number | string, options?: ParseOptions) {
  const base = options?.[ParsedKey] ?? "";
  return options === undefined
    ? { [ParsedKey]: join("", String(s)) }
    : { ...options, [ParsedKey]: join(base, String(s)) };
}
