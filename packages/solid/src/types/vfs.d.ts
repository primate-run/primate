declare module "solid:views" {
  import type { Dict } from "@rcompat/type";
  import type { Component } from "solid-js";

  const map: Dict<Component<any>>;
  export = map;
}

declare module "solid:root" {
  import type { RootProps } from "#client/root";
  import type { Component } from "solid-js";

  const root: Component<RootProps>;
  export default root;
}
