declare module "react:views" {
  import type { Dict } from "@rcompat/type";
  import type { FunctionComponent } from "react";
  const map: Dict<FunctionComponent>;
  export = map;
}

declare module "react:root" {
  import type { RootProps } from "#client/root";
  import type { ComponentType } from "react";
  const RootView: ComponentType<RootProps>;
  export default RootView;
}
