declare module "app:svelte" {
  import type { RequestPublic } from "@primate/core";
  import type { Writable } from "svelte/store";
  export const request: Writable<RequestPublic>;
}
