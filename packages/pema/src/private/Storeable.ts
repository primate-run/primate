import type DataType from "#DataType";
import Parsed from "#Parsed";

type DataKey = keyof DataType;

export default abstract class Storeable<T extends DataKey = DataKey>
  extends Parsed<unknown> {
  abstract get datatype(): T;
}
