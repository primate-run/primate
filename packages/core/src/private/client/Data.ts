import type { Dict } from "@rcompat/type";
import type Mode from "#Mode";

type ClientData<T extends Dict = Dict> = {
  view: string;
  request: Dict;
  spa: boolean;
  ssr: boolean;
  mode: Mode;
} & T;

export type { ClientData as default };
