import type Mode from "#Mode";
import type RequestView from "#request/RequestView";
import type { Dict } from "@rcompat/type";

type ClientData<T extends Dict = Dict> = {
  view: string;
  request: RequestView;
  spa: boolean;
  ssr: boolean;
  mode: Mode;
} & T;

export type { ClientData as default };
