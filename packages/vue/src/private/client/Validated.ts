import type ValidateUpdater from "@primate/core/frontend/ValidateUpdater";
import type ValidationError from "@primate/core/frontend/ValidationError";
import { type Ref } from "vue";

type Validated<T> = {
  error: Ref<null | ValidationError>;
  loading: Ref<boolean>;
  update: (updater: ValidateUpdater<T>) => Promise<void>;
  value: Ref<T>;
};

export type { Validated as default };
