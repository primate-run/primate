declare module "app:solid" {
  import type { RequestPublic } from "@primate/core";
  import type { Accessor } from "solid-js";
  export const request: Accessor<RequestPublic>;
}
