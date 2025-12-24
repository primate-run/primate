declare module "vue:views" {
  import type { Dict } from "@rcompat/type";
  import type { Component } from "vue";
  const map: Dict<Component>;
  export = map;
}

declare module "vue:root" {
  import type { Component } from "vue";
  const root: Component;
  export default root;
}
