import type ValidateState from "#client/ValidateState";
import type ValidateUpdater from "@primate/core/client/ValidateUpdater";
import type { Readable } from "svelte/store";

type Validated<T> = {
  update: (updater: ValidateUpdater<T>) => Promise<void>;
} & Readable<ValidateState<T>>;

export type { Validated as default };
