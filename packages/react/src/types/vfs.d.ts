declare module "react:views" {
  import type { Dict } from "@rcompat/type";
  import type { FunctionComponent } from "react";
  const map: Dict<FunctionComponent>;
  export = map;
}

declare module "react:root" {
  import type { FunctionComponent } from "react";
  const root: FunctionComponent;
  export default root;
}
