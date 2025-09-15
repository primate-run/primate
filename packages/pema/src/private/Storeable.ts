import type K from "#DataKey";
import Parsed from "#Parsed";
import type Serialized from "#Serialized";

export default abstract class Storeable<T extends K = K>
  extends Parsed<unknown> {
  abstract get datatype(): T;
  abstract toJSON(): Serialized;

  static serialize<N extends string, T extends K>(s: { name: N; datatype: T }) {
    return { type: s.name, datatype: s.datatype };
  }
}
