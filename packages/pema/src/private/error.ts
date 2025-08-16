import expected from "#expected";
import ParsedKey from "#ParsedKey";
import type ParseIssue from "#ParseIssue";
import type ParseOptions from "#ParseOptions";

export default function error(
  name: string,
  x: unknown,
  options?: ParseOptions,
): [ParseIssue] {
  return [{
    input: x,
    key: options?.[ParsedKey],
    message: expected(name, x),
  }];
};
