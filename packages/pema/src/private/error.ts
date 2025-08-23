import expected from "#expected";
import ParsedKey from "#ParsedKey";
import type ParseIssue from "#ParseIssue";
import type ParseOptions from "#ParseOptions";

export default function error<T>(
  name: string,
  x: unknown,
  options?: ParseOptions<T>,
): [ParseIssue] {
  return [{
    input: x,
    message: expected(name, x),
    path: options?.[ParsedKey] ?? "",
  }];
};
