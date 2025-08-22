import type Issue from "pema/Issue";

type ValidationError = {
  issues?: ReadonlyArray<Issue>;
} & Error;

export type { ValidationError as default };
