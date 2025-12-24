import type { Issue } from "pema";

type ValidationError = { issues?: ReadonlyArray<Issue> } & Error;

export type { ValidationError as default };
