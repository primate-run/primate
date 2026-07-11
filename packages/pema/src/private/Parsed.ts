import CoerceKey from "#CoerceKey";
import Loose from "#Loose";
import ParsedKey from "#ParsedKey";
import type ParseOptions from "#ParseOptions";
import type Serialized from "#Serialized";
import type { Serializable } from "@rcompat/type";

export default abstract class Parsed<StaticType> implements Serializable {
  get [ParsedKey]() {
    return "ParsedKey" as const;
  }

  get infer() {
    return undefined as StaticType;
  }

  get nullable() {
    return false;
  }

  [Loose]: boolean | undefined = undefined;

  [CoerceKey](x: unknown) {
    return x;
  }

  abstract get name(): string;

  derive<Output>(derive: (value: StaticType) => Output): Parsed<Output> {
    return new DerivedType(this, derive);
  }

  /**
  * Parse the given value.
  *
  * @param u Value to parse.
  *
  * @throws `ParseError` if the value could not be parsed.
  *
  * @returns The parsed value, if successfully parsed.
  */
  abstract parse(u: unknown, options?: ParseOptions): StaticType;

  abstract toJSON(): Serialized;
}

class DerivedType<Input, Output> extends Parsed<Output> {
  #schema: Parsed<Input>;
  #derive: (value: Input) => Output;

  constructor(schema: Parsed<Input>, derive: (value: Input) => Output) {
    super();
    this.#schema = schema;
    this.#derive = derive;
  }

  get name() {
    return this.#schema.name;
  }

  parse(u: unknown, options?: ParseOptions): Output {
    return this.#derive(this.#schema.parse(u, options));
  }

  toJSON() {
    return this.#schema.toJSON();
  }
}
