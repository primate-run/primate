import type ParseOptions from "#ParseOptions";
import PrimitiveType from "#PrimitiveType";
import type Validator from "#Validator";
import max from "#validator/max";
import min from "#validator/min";
import range from "#validator/range";
import values from "#validator/values";
import type Newable from "@rcompat/type/Newable";

type Next<T> = {
  options?: ParseOptions;
  validators?: Validator<T>[];
};

export default abstract class NumericType<
  Datatype,
  T extends bigint | number,
  Name extends string>
  extends PrimitiveType<T, Name> {
  #datatype: Datatype;

  constructor(
    datatype: Datatype,
    validators: Validator<T>[] = [],
    options: ParseOptions = {},
  ) {
    super(validators, options);
    this.#datatype = datatype;
  }

  derive(next: Next<T>): this {
    const Constructor = this.constructor as Newable<this>;
    return new Constructor(
      this.#datatype,
      [...this.validators, ...next.validators ?? []],
      { ...this.options, ...next.options ?? {} },
    );
  }

  values(anyof: Record<string, T>) {
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
}
