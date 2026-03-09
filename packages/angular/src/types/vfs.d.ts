declare module "angular:views" {
  import type { Type } from "@angular/core";
  import type { Dict } from "@rcompat/type";

  const map: Dict<Type<unknown>>;
  export = map;
}

declare module "angular:root" {
  import type { Type } from "@angular/core";
  import type { RootProps } from "#client/root";

  type RootInstance = {
    p: RootProps;
  };

  const root: Type<RootInstance>;
  export default root;
}
