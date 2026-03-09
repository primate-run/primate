declare module "svelte:views" {
  import type { Dict } from "@rcompat/type";
  import type { Component } from "svelte";
  const map: Dict<Component>;
  export = map;
}

declare module "svelte:root" {
  import type { RootProps } from "#client/root";
  import type { Component } from "svelte";

  const Root: Component<{ p: RootProps }>;
  export default Root;
}
