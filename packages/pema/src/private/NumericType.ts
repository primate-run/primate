import type DataKey from "#DataKey";
import Loose from "#Loose";
import type Mode from "#Mode";
import type ParseOptions from "#ParseOptions";
import PrimitiveType from "#PrimitiveType";
import type Storable from "#Storable";
import type Validator from "#Validator";
import max from "#validator/max";
import min from "#validator/min";
import range from "#validator/range";
import values from "#validator/values";
import type { Dict, Newable } from "@rcompat/type";

type Next<T> = {
  options?: ParseOptions;
  validators?: Validator<T>[];
};

export default abstract class NumericType<
  Key extends DataKey,
  T extends bigint | number,
  Name extends string,
  M extends Mode = undefined,
> extends PrimitiveType<T, Name>
  implements Storable<Key> {
  #datatype: Key;
  [Loose]: M;

  constructor(
    datatype: Key,
    mode: M = undefined as M,
    validators: Validator<T>[] = [],
    options: ParseOptions = {},
  ) {
    super(validators, options);
    this.#datatype = datatype;
    this[Loose] = mode as M;
  }

  derive(next: Next<T>): this {
    const Constructor = this.constructor as Newable<this>;
    return new Constructor(
      this.#datatype,
      this[Loose],
      [...this.validators, ...next.validators ?? []],
      { ...this.options, ...next.options ?? {} },
    );
  }

  values(anyof: Dict<T>) {
    return this.derive({ validators: [values(anyof)] });
  }

  range(from: T, to: T) {
    return this.derive({ validators: [range(from, to)] });
  }

  min(from: T) {
    return this.derive({ validators: [min(from)] });
  }

  max(to: T) {
    return this.derive({ validators: [max(to)] });
  }

  get datatype() {
    return this.#datatype;
  }

  toJSON() {
    return {
      type: this.name as "number" | "bigint",
      datatype: this.#datatype,
    };
  }
}
