import type Module from "@primate/core/frontend/Module";
import { type MarkedExtension } from "marked";

type InputArgs = [
  options: typeof Module.input | undefined,
  markedOptions: MarkedExtension | undefined,
];

export type { InputArgs as default };
