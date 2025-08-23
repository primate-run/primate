import DefaultType from "#DefaultType";
import expect from "#expect";
import GenericType from "#GenericType";
import schema from "#index";
import type Infer from "#Infer";
import type InferInputSchema from "#InferInputSchema";
import type InferSchema from "#InferSchema";
import OptionalType from "#OptionalType";
import Parsed from "#Parsed";
import ParsedKey from "#ParsedKey";
import ParseError from "#ParseError";
import type ParseOptions from "#ParseOptions";
import join from "#path/join";
import type Schema from "#Schema";
import type OptionalTrait from "#trait/Optional";
import type Newable from "@rcompat/type/Newable";

const all_optional = (s: object): boolean => Object.values(s).every(value => {
  if (value instanceof OptionalType || value instanceof DefaultType) {
    return true;
  };
  if (typeof value === "object" && value !== null) {
    return all_optional(value);
  }
  return false;
});

export default class SchemaType<S extends Schema>
  extends GenericType<S, InferSchema<S>, "SchemaType">
  implements OptionalTrait {
  #schema: S;
  #options: ParseOptions;

  constructor(spec: S, options: ParseOptions = {}) {
    super();
    this.#schema = spec;
    this.#options = options;
  }

  get name() {
    return "schema";
  }

  get input() {
    return undefined as InferInputSchema<S>;
  }

  get schema() {
    return this.#schema;
  }

  optional() {
    return new OptionalType(this);
  }

  #derive(next: ParseOptions): this {
    const Constructor = this.constructor as Newable<this>;
    return new Constructor(this.#schema, { ...this.#options, ...next });
  }

  get coerce() {
    return this.#derive({ coerce: true });
  }

  parse(x: unknown, options: ParseOptions = {}): Infer<this> {
    const $options = { ...this.#options, ...options };
    const s = this.#schema;

    if (s instanceof Parsed) {
      return s.parse(x, $options) as Infer<this>;
    }

    if (typeof s === "object" && s !== null) {
      let _x = x;
      if (typeof _x !== "object" || _x === null) {
        // Allow undefined if all fields are optional or defaulted
        if (!all_optional(s)) {
          throw new ParseError([{
            input: x,
            message: expect("o", x),
            path: "",
          }]);
        } else {
          _x = {};
        }
      }
      const result: any = {};
      for (const k in s) {
        const r = schema((s as any)[k]).parse((_x as any)[k], {
          ...$options, [ParsedKey]: join($options[ParsedKey] ?? "", String(k)),
        });
        // exclude undefined (optionals)
        if (r !== undefined) {
          result[k] = r;
        }
      }
      return result;
    }

    throw new Error("Invalid schema structure");
  }
}
