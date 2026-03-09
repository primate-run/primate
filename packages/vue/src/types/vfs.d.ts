declare module "vue:views" {
  import type { Component } from "vue";
  import type { Dict } from "@rcompat/type";

  const map: Dict<Component>;
  export = map;
}

declare module "vue:root" {
  import type { DefineComponent } from "vue";
  import type { RootProps } from "#client/root";

  const RootView: DefineComponent<{ p: RootProps }>;
  export default RootView;
}
