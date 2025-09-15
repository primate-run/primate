import BuiltinType from "#BuiltinType";
import coerce from "#coerce/date";
import CoerceKey from "#CoerceKey";
import Storeable from "#Storeable";

export default class DateType
  extends BuiltinType<Date, "DateType">
  implements Storeable<"datetime"> {
  [CoerceKey] = coerce;

  get Type() {
    return Date;
  }

  get name() {
    return "date" as const;
  }

  get datatype() {
    return "datetime" as const;
  }

  toJSON() {
    return Storeable.serialize(this);
  }
}
