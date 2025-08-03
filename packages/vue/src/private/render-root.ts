import type Dict from "@rcompat/type/Dict";
import type { Component } from "vue";
import { defineComponent, h } from "vue";

export default function renderRoot(component: Component, props: Dict) {
  return defineComponent({
    name: "Root",
    setup() {
      return () => h("div", { id: "app" }, [h(component, props)]);
    },
  });
}
