import type ValidateUpdater from "@primate/core/frontend/ValidateUpdater";
import type ValidationError from "@primate/core/frontend/ValidationError";

type Validated<T> = {
  error: () => null | ValidationError<T>;
  loading: () => boolean;
  update: (updater: ValidateUpdater<T>) => Promise<void>;
  value: () => T;
};

export type { Validated as default };
