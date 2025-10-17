import { InjectionToken } from "@angular/core";
import type Dict from "@rcompat/type/Dict";

type RootProps = {
  views: any[];
  props: Dict[]; request: any;
  update?: () => void;
};
export default new InjectionToken<RootProps>("INITIAL_PROPS");
