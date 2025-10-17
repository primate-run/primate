declare module "angular:views" {
  import type { Type } from "@angular/core";
  import type Dict from "@rcompat/type/Dict";
  const map: Dict<Type>;
  export = map;
}

declare module "angular:root" {
  import type { Type } from "@angular/core";
  const root: Type;
  export default root;
}
