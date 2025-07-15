import PrimitiveType from "#PrimitiveType";
import type Storeable from "#Storeable";

export default class NumberType
  extends PrimitiveType<number, "NumberType">
  implements Storeable<"f64"> {

  constructor() {
    super("number");
  }

  get datatype() {
    return "f64" as const;
  }

  normalize(value: number) {
    return value;
  }
}
