import DefaultType from "#DefaultType";
import fail from "#fail";
import type Infer from "#Infer";
import type ObjectType from "#ObjectType";
import OptionalType from "#OptionalType";
import type Parsed from "#Parsed";
import type ParseOptions from "#ParseOptions";
import Storable from "#Storable";
import type { Dict, JSONValue } from "@rcompat/type";

type JSONInfer<S extends ObjectType<Dict<Parsed<JSONValue>>> | undefined> =
  S extends ObjectType<Dict<Parsed<JSONValue>>> ? Infer<S> : JSONValue;

export default class JSONType<S extends ObjectType<Dict<Parsed<JSONValue>>> | undefined = undefined>
  extends Storable<"json", JSONInfer<S>> {
  #inner: S;

  constructor(inner?: S) {
    super();
    this.#inner = inner as S;
  }

  get name() {
    return "json" as const;
  }

  get datatype() {
    return "json" as const;
  }

  optional() {
    return new OptionalType(this);
  }

  default(value: (() => Infer<this>) | Infer<this>) {
    return new DefaultType(this, value);
  }

  parse(x: unknown, options: ParseOptions = {}): Infer<this> {
    if (this.#inner !== undefined) {
      // delegate to inner schema for typed validation
      return this.#inner.parse(x, options) as never;
    }

    // if no inner schema, just validate JSONValue
    try {
      return JSON.parse(JSON.stringify(x));
    } catch {
      throw fail("json", x, options);
    }
  }

  toJSON() {
    return {
      type: "json" as const,
      datatype: "json" as const,
      ...(this.#inner !== undefined && { of: this.#inner.toJSON() }),
    };
  }
}
