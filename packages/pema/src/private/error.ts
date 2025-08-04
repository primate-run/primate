import expected from "#expected";
import ValidatedKey from "#ValidatedKey";
import type ValidationIssue from "#ValidationIssue";
import type Options from "#ValidationOptions";

export default function error(name: string, x: unknown, options?: Options): [ValidationIssue] {
  return [{
    input: x,
    key: options?.[ValidatedKey],
    message: expected(name, x),
  }];
};
