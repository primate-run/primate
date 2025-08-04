import error from "#error";
import expected from "#expected";
import GenericType from "#GenericType";
import type Infer from "#Infer";
import OptionalType from "#OptionalType";
import type RecordTypeKey from "#RecordTypeKey";
import type Validated from "#Validated";
import ValidatedKey from "#ValidatedKey";
import ValidationError from "#ValidationError";
import type ValidationOptions from "#ValidationOptions";

const nextOptions = (k: string, options?: ValidationOptions) => {
  return options === undefined
    ? { [ValidatedKey]: `${k}` }
    : { ...options, [ValidatedKey]: `${options[ValidatedKey] ?? ""}${k}` };
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

  validate(x: unknown, options: ValidationOptions = {}): Infer<this> {
    if (typeof x !== "object" || x === null) {
      throw new ValidationError(error("object", x, options));
    }
    const _options = { ...options };

    const key_name = this.#key.name;
    const keys = Object.keys(x);
    const symbols = Object.getOwnPropertySymbols(x);

    if (key_name === "string" || key_name === "number") {
      // no key may be a symbol
      if (symbols.length > 0) {
        throw new ValidationError([{
          input: x,
          message: expected(`${key_name} key`, symbols[0]),
        }]);
      }

      keys.forEach(k => {
        if (key_name === "string" && is_numeric(k)) {
          throw new ValidationError([{
            input: x,
            message: expected("string key", +k),
          }]);
        }
        if (key_name === "number" && !is_numeric(k)) {
          throw new ValidationError([{
            input: x,
            message: expected("number key", k),
          }]);
        }

        this.#value.validate((x as Record<number | string, unknown>)[k],
          nextOptions(k, options));
      });
    }

    if (key_name === "symbol") {
      // no key may not be a symbol
      if (keys.length > 0) {
        throw new ValidationError([{
          input: x,
          message: expected("symbol key", keys[0]),
        }]);
      }
      symbols.forEach(k => {
        this.#value.validate((x as Record<symbol, unknown>)[k],
          nextOptions(k.toString(), options));
      });
    }

    return x as never;
  }
}
