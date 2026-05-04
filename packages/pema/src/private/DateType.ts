import BuiltinType from "#BuiltinType";
import coerce from "#coerce/date";
import CoerceKey from "#CoerceKey";
import Loose from "#Loose";
import Storable from "#Storable";

export default class DateType<M extends boolean | undefined = undefined>
  extends BuiltinType<Date, "DateType">
  implements Storable<"datetime"> {
  [CoerceKey] = coerce;
  [Loose]: M;

  constructor(mode?: M) {
    super();
    this[Loose] = mode as M;
  }

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
