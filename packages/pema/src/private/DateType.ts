import BuiltinType from "#BuiltinType";
import coerce from "#coerce/date";
import CoerceKey from "#CoerceKey";
import type Storeable from "#Storeable";

export default class DateType
  extends BuiltinType<Date, "DateType">
  implements Storeable<"datetime"> {
  [CoerceKey] = coerce;

  get Type() {
    return Date;
  }

  get name() {
    return "date";
  }

  get datatype() {
    return "datetime" as const;
  }
}
