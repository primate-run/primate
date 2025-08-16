import BuiltinType from "#BuiltinType";
import coerce from "#coerce/date";
import CoerceKey from "#CoerceKey";
import type Storeable from "#Storeable";

export default class DateType
  extends BuiltinType<Date, "DateType">
  implements Storeable<"datetime"> {
  [CoerceKey] = coerce;

  constructor() {
    super("date", Date);
  }

  get datatype() {
    return "datetime" as const;
  }
}
