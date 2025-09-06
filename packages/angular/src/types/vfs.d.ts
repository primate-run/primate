declare module "angular:components" {
  import type Dict from "@rcompat/type/Dict";
  import type { Type } from "@angular/core";
  const map: Dict<Type>;
  export = map;
}

declare module "angular:root" {
  import type { Type } from "@angular/core";
  const root: Type;
  export = root;
}
