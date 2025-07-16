import type Dict from "@rcompat/type/Dict";

type Component = {
  name: string;
  props: Dict;
  component: unknown;
};

export type { Component as default };
