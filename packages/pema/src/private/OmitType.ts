import E from "#errors";
import GenericType from "#GenericType";
import type Infer from "#Infer";
import Loose from "#Loose";
import type Mode from "#Mode";
import type ObjectType from "#ObjectType";
import type Parsed from "#Parsed";
import ParsedKey from "#ParsedKey";
import type ParseOptions from "#ParseOptions";
import join from "#path/join";
import resolve from "#resolve";
import type Serialized from "#Serialized";
import is from "@rcompat/is";
import type { Dict } from "@rcompat/type";

export default class OmitType<
  P extends Dict<Parsed<unknown>>,
  K extends keyof P,
  M extends Mode = undefined,
> extends GenericType<
  Omit<P, K>,
  Omit<{ [Key in keyof P]: Infer<P[Key]> }, K>,
  "OmitType"
> {
  #properties: Omit<P, K>;
  [Loose]: M;

  constructor(type: ObjectType<P>, keys: K[], mode?: M) {
    super();
    const props = { ...type.properties };
    for (const key of keys) {
      delete props[key];
    }
    this.#properties = props as Omit<P, K>;
    this[Loose] = mode as M;
  }

  get name() {
    return "omit" as const;
  }

  parse(u: unknown, options: ParseOptions = {}): Infer<this> {
    const x = resolve(u);

    if (!is.dict(x)) throw E.invalid_type(x, "object", options);

    const out: Dict = {};
    const props = this.#properties as Dict<Parsed<unknown>>;

    for (const k in props) {
      const field = props[k];
      const parsed = field.parse(x[k], {
        ...options, [ParsedKey]: join(options[ParsedKey] ?? "", String(k)),
      });
      if (is.defined(parsed)) out[k] = parsed;
    }
    return out as never;
  }

  toJSON() {
    const properties: Dict<Serialized> = {};
    const props = this.#properties as Dict<Parsed<unknown>>;
    for (const [k, v] of Object.entries(props)) {
      properties[k] = v.toJSON();
    }
    return { type: "omit" as const, properties };
  }
}
