import type ValidationError from "@primate/core/client/ValidationError";

type ValidateState<T> = {
  error: null | ValidationError;
  loading: boolean;
  value: T;
};

export type { ValidateState as default };
