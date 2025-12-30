import type { Signal } from "@angular/core";
import type { ValidateUpdater, ValidationError } from "@primate/core/client";

type Validated<T> = {
  error: Signal<null | ValidationError>;
  loading: Signal<boolean>;
  update: (updater: ValidateUpdater<T>) => Promise<void>;
  value: Signal<T>;
};

export type { Validated as default };
