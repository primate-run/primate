import type Dictionary from "@rcompat/type/Dictionary";

type ClientData<T extends Dictionary = Dictionary> = {
  component: string;
  request: Dictionary;
  ssr: boolean;
  spa: boolean;
} & T;

export type { ClientData as default };
