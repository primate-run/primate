declare module "app:angular" {
  import type { RequestPublic } from "@primate/core";
  import type { Signal } from "@angular/core";
  export const request: Signal<RequestPublic>;
}
