import type Dict from "@rcompat/type/Dict";

type Component = {
  component: unknown;
  name: string;
  props: Dict;
};

export type { Component as default };
