declare module "poly:views" {
  import type Dict from "@rcompat/type/Dict";
  import type { Component } from "poly";
  const map: Dict<Component>;
  export = map;
}

declare module "poly:root" {
  import type { Component } from "poly";
  const root: Component;
  export default root;
}
