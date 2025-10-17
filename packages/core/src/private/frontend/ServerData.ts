import type Dict from "@rcompat/type/Dict";

type ServerData<V> = {
  view: V;
  props: Dict;
};

export type { ServerData as default };
