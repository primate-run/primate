import CoercedType from "#CoercedType";
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
import type Schema from "#Schema";

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
  extends GenericType<S, InferSchema<S>, "SchemaType"> {
  #schema: S;

  constructor(s: S) {
    super();
    this.#schema = s;
  }

  get name() {
    return "schema";
  }

  get input() {
    return undefined as InferInputSchema<S>;
  }

  optional() {
    return new OptionalType(this);
  }

  get coerce() {
    return new CoercedType(this);
  }

  parse(x: unknown, options: ParseOptions = {}): Infer<this> {
    const s = this.#schema;

    if (s instanceof Parsed) {
      return s.parse(x, options) as Infer<this>;
    }

    if (typeof s === "object" && s !== null) {
      let _x = x;
      if (typeof _x !== "object" || _x === null) {
        // Allow undefined if all fields are optional or defaulted
        if (!all_optional(s)) {
          throw new ParseError([{
            input: x,
            message: expect("o", x),
          }]);
        } else {
          _x = {};
        }
      }
      const result: any = {};
      for (const k in s) {
        const r = schema((s as any)[k]).parse((_x as any)[k], {
          ...options, [ParsedKey]: `.${k}`,
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
