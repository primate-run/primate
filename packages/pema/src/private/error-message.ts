import ValidatedKey from "#ValidatedKey";
import type Options from "#ValidationOptions";
import expected from "#expected";

export default function error(name: string, x: unknown, options?: Options) {
  const base = expected(name, x);
  return options?.[ValidatedKey] === undefined
    ? base
    : `${options[ValidatedKey]}: ${base}`;
};
