import BuiltinType from "#BuiltinType";
import coerce from "#coerce/date";
import CoerceKey from "#CoerceKey";
import Storable from "#Storable";

export default class DateType
  extends BuiltinType<Date, "DateType">
  implements Storable<"datetime"> {
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
    return Storable.serialize(this);
  }
}
