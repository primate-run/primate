import type ValidatedKey from "#ValidatedKey";

export default interface ValidationOptions {
  coerce?: boolean;
  partial?: boolean;
  [ValidatedKey]?: string;
};
