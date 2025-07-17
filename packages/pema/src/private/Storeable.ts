import type DataType from "#DataType";
import type Infer from "#Infer";
import Validated from "#Validated";

export default abstract class Storeable<T extends keyof DataType = keyof DataType>
  extends Validated<unknown> {
  abstract get datatype(): T;

  abstract normalize(value: Infer<this>): DataType[T];
}
