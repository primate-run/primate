declare module "vue:components" {
  import type Dict from "@rcompat/type/Dict";
  import type { Component } from "vue";
  const map: Dict<Component>;
  export = map;
}

declare module "vue:root" {
  import type { Component } from "vue";
  const root: Component;
  export = root;
}
