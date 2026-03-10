import type { Dict } from "@rcompat/type";

type ServerData<V> = {
  view: V;
  props: Dict;
};

export type { ServerData as default };
