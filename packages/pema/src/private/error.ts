import ValidatedKey from "#ValidatedKey";
import type ValidationOptions from "#ValidationOptions";

export default (message: string, options?: ValidationOptions) =>
  options?.[ValidatedKey] === undefined
    ? message
    : `${options[ValidatedKey]}: ${message}`;
