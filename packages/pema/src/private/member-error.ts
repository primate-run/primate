import ParsedKey from "#ParsedKey";
import type ParseOptions from "#ParseOptions";

export default function member_error(i: unknown, options?: ParseOptions) {
  return options === undefined
    ? { [ParsedKey]: `.${i}` }
    : { ...options, [ParsedKey]: `${options[ParsedKey] ?? ""}.${i}` };
};

