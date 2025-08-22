import error from "#error";
import expected from "#expected";
import GenericType from "#GenericType";
import type Infer from "#Infer";
import OptionalType from "#OptionalType";
import type Parsed from "#Parsed";
import ParsedKey from "#ParsedKey";
import ParseError from "#ParseError";
import type ParseOptions from "#ParseOptions";
import join from "#path/join";
import type RecordTypeKey from "#RecordTypeKey";
import type OptionalTrait from "#trait/Optional";

const nextOptions = (k: string, options?: ParseOptions) => {
  const base = options?.[ParsedKey] ?? "";
  return options === undefined
    ? { [ParsedKey]: join("", k) }
    : { ...options, [ParsedKey]: join(base, k) };
};

const is_numeric = (string: string) => /^-?\d+(\.\d+)?$/.test(string);

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
    return "record";
  }

  parse(x: unknown, options: ParseOptions = {}): Infer<this> {
    if (typeof x !== "object" || x === null) {
      throw new ParseError(error("object", x, options));
    }
    const key_name = this.#key.name;
    const keys = Object.keys(x);
    const symbols = Object.getOwnPropertySymbols(x);
    const base = options[ParsedKey] ?? "";

    if (key_name === "string" || key_name === "number") {
      // no key may be a symbol
      if (symbols.length > 0) {
        throw new ParseError([{
          input: x,
          message: expected(`${key_name} key`, symbols[0]),
          path: base,
        }]);
      }

      keys.forEach(k => {
        if (key_name === "string" && is_numeric(k)) {
          throw new ParseError([{
            input: x,
            message: expected("string key", +k),
            path: join(base, k),
          }]);
        }
        if (key_name === "number" && !is_numeric(k)) {
          throw new ParseError([{
            input: x,
            message: expected("number key", k),
            path: join(base, k),
          }]);
        }

        this.#value.parse((x as Record<number | string, unknown>)[k],
          nextOptions(k, options));
      });
    }

    if (key_name === "symbol") {
      // disallow any non-symbol keys
      if (keys.length > 0) {
        throw new ParseError([{
          input: x,
          message: expected("symbol key", keys[0]),
          path: join(base, keys[0]),
        }]);
      }
      symbols.forEach(k => {
        this.#value.parse((x as Record<symbol, unknown>)[k], options);
      });
    }

    return x as never;
  }
}
