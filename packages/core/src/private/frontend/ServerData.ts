import type Dict from "@rcompat/type/Dict";

type ServerData<T> = {
  component: T;
  props: Dict;
};

export type { ServerData as default };
