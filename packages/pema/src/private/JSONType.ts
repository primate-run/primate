import DefaultType from "#DefaultType";
import E from "#errors";
import type Infer from "#Infer";
import OptionalType from "#OptionalType";
import type Parsed from "#Parsed";
import type ParseOptions from "#ParseOptions";
import resolve from "#resolve";
import type Serialized from "#Serialized";
import Storable from "#Storable";
import is from "@rcompat/is";
import type { JSONValue } from "@rcompat/type";

export type ParsedJSON = Parsed<JSONValue>;
type JSONInput = ParsedJSON | undefined;

type JSONInfer<S extends JSONInput> = S extends ParsedJSON
  ? Infer<S>
  : JSONValue
  ;

export default class JSONType<S extends JSONInput = undefined>
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

  parse(u: unknown, options: ParseOptions = {}): Infer<this> {
    const x = resolve(u);

    if (this.#inner !== undefined) {
      // delegate to inner schema for typed validation
      return this.#inner.parse(x, options) as never;
    }

    if (!is.json(x)) throw E.invalid_type(x, "json", options);

    return JSON.parse(JSON.stringify(x));
  }

  toJSON() {
    return {
      type: "json" as const,
      datatype: "json" as const,
      ...(this.#inner !== undefined && { of: this.#inner.toJSON() }),
    } as { type: "json"; datatype: "json"; of?: Serialized };
  }
}
