import type ValidateUpdater from "@primate/core/client/ValidateUpdater";
import type ValidationError from "@primate/core/client/ValidationError";

type Validated<T> = {
  error: () => null | ValidationError;
  loading: () => boolean;
  update: (updater: ValidateUpdater<T>) => Promise<void>;
  value: () => T;
};

export type { Validated as default };
