declare module "solid:views" {
  import type { Dict } from "@rcompat/type";
  import type { Component } from "solid-js";
  const map: Dict<Component>;
  export = map;
}

declare module "solid:root" {
  import type { Component } from "solid-js";
  const root: Component;
  export default root;
}
