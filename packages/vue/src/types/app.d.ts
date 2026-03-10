declare module "app:vue" {
  import type { RequestPublic } from "@primate/core";
  import type { Ref } from "vue";
  export function useRequest(): Ref<RequestPublic>;
}
