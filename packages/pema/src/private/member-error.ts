import ValidatedKey from "#ValidatedKey";
import type ValidationOptions from "#ValidationOptions";

export default function member_error(i: unknown, options?: ValidationOptions) {
  return options === undefined
    ? { [ValidatedKey]: `[${i}]` }
    : { ...options, [ValidatedKey]: `${options[ValidatedKey] ?? ""}[${i}]` };
};

