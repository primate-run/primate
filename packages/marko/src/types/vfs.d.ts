declare module "marko:views" {
  import type { Template } from "marko/src/runtime/html/index.js";
  const map: Record<string, Template>;
  export = map;
}

declare module "marko:root" {
  import type { Template } from "marko/src/runtime/html/index.js";
  const Root: Template;
  export default Root;
}

declare module "#tags/*" {
  const Field: unknown;
  export default Field;
}
