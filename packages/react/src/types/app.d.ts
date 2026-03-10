declare module "app:react" {
  import type { RequestView } from "@primate/core";
  const useRequest: () => RequestView;
  export const useRequest;
}
