declare module "svelte:views" {
  import type { Dict } from "@rcompat/type";
  import type { Component } from "svelte";
  const map: Dict<Component>;
  export = map;
}

declare module "svelte:root" {
  import type { Component } from "svelte";
  const root: Component;
  export default root;
}
