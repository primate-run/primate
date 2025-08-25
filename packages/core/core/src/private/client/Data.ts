import type Dict from "@rcompat/type/Dict";

type ClientData<T extends Dict = Dict> = {
  component: string;
  request: Dict;
  spa: boolean;
  ssr: boolean;
} & T;

export type { ClientData as default };
