import type K from "#DataKey";
import Parsed from "#Parsed";
import type Serialized from "#Serialized";
import is from "@rcompat/is";

export default abstract class Storable<TKey extends K = K, TValue = unknown>
  extends Parsed<TValue> {
  abstract get datatype(): TKey;
  abstract toJSON(): Serialized;

  static serialize<N extends string, T extends K>(s: { name: N; datatype: T }) {
    return { type: s.name, datatype: s.datatype };
  }

  static is(x: unknown): x is Storable {
    return is.object(x) && "datatype" in x;
  }
}
