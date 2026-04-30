import E from "#errors";
import GenericType from "#GenericType";
import type Infer from "#Infer";
import OptionalType from "#OptionalType";
import type Parsed from "#Parsed";
import ParsedKey from "#ParsedKey";
import type ParseOptions from "#ParseOptions";
import join from "#path/join";
import next from "#path/next";
import type RecordTypeKey from "#RecordTypeKey";
import resolve from "#resolve";
import type OptionalTrait from "#trait/Optional";
import is from "@rcompat/is";

export default class RecordType<
  Key extends RecordTypeKey,
  Value extends Parsed<unknown>,
> extends GenericType<Value, Record<Infer<Key>, Infer<Value>>, "RecordType">
  implements OptionalTrait {
  #key: Key;
  #value: Value;

  constructor(k: Key, v: Value) {
    super();
    this.#key = k;
    this.#value = v;
  }

  optional() {
    return new OptionalType(this);
  }

  get name() {
    return "record" as const;
  }

  parse(u: unknown, options: ParseOptions = {}): Infer<this> {
    const x = resolve(u);

    const path = options[ParsedKey] ?? "";
    if (!is.dict(x)) throw E.invalid_type(x, "object", path);

    const key_name = this.#key.name;
    const keys = Object.keys(x);
    const symbols = Object.getOwnPropertySymbols(x);

    if (key_name === "string" || key_name === "number") {
      // no key may be a symbol
      if (symbols.length > 0) throw E.invalid_type(x, `${key_name} key`, path);

      keys.forEach(k => {
        if (key_name === "string" && is.numeric(k)) {
          throw E.invalid_type(x, "string key", join(path, k));
        }
        if (key_name === "number" && !is.numeric(k)) {
          throw E.invalid_type(x, "number key", join(path, k));
        }

        this.#value.parse((x as Record<number | string, unknown>)[k],
          next(k, options));
      });
    }

    if (key_name === "symbol") {
      // disallow any non-symbol keys
      if (keys.length > 0) {
        throw E.invalid_type(keys[0], "symbol key", join(path, keys[0]));
      }
      symbols.forEach(k => {
        this.#value.parse((x as Record<symbol, unknown>)[k], options);
      });
    }

    return x as never;
  }

  toJSON() {
    return {
      type: this.name,
      key: this.#key.toJSON(),
      value: this.#value.toJSON(),
    };
  }
}
