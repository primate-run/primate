import type ValidationError from "@primate/core/frontend/ValidationError";

type ValidateState<T> = {
  error: null | ValidationError<T>;
  loading: boolean;
  value: T;
};

export type { ValidateState as default };
