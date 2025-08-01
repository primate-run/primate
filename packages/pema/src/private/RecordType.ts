import GenericType from "#GenericType";
import type Infer from "#Infer";
import OptionalType from "#OptionalType";
import type RecordTypeKey from "#RecordTypeKey";
import type Validated from "#Validated";
import expected from "#expected";

const error = (k: string, key?: string) => {
  return key === undefined
    ? `.${k}`
    : `${key}.${k}`;
};

const is_numeric = (string: string) => /^-?\d+(\.\d+)?$/.test(string);

export default class RecordType<
  Key extends RecordTypeKey,
  Value extends Validated<unknown>,
> extends
  GenericType<Value, Record<Infer<Key>, Infer<Value>>, "RecordType"> {
  #key: Key;
  #value: Value;

  constructor(k: Key, v: Value) {
    super();
    this.#key = k;
    this.#value = v;
  }

  /**
  * Value is optional.
  */
  optional() {
    return new OptionalType(this);
  }

  get name() {
    return "record";
  }

  validate(x: unknown, key?: string): Infer<this> {
    if (typeof x !== "object" || x === null) {
      throw new Error("Expected object");
    }

    const key_name = this.#key.name;
    const keys = Object.keys(x);
    const symbols = Object.getOwnPropertySymbols(x);

    if (key_name === "string" || key_name === "number") {
      // no key may be a symbol
      if (symbols.length > 0) {
        throw new Error(expected(`${key_name} key`, symbols[0]));
      }

      keys.forEach(k => {
        if (key_name === "string" && is_numeric(k)) {
          throw new Error(expected("string key", +k));
        }
        if (key_name === "number" && !is_numeric(k)) {
          throw new Error(expected("number key", k));
        }

        this.#value.validate((x as Record<number | string, unknown>)[k],
          error(k.toString(), key));
      });
    }

    if (key_name === "symbol") {
      // no key may not be a symbol
      if (keys.length > 0) {
        throw new Error(expected("symbol key", keys[0]));
      }
      symbols.forEach(k => {
        this.#value.validate((x as Record<symbol, unknown>)[k],
          error(k.toString(), key));
      });
    }

    return x as never;
  }
}
