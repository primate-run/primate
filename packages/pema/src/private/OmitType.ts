import GenericType from "#GenericType";
import type Infer from "#Infer";
import type ObjectType from "#ObjectType";
import type Parsed from "#Parsed";
import ParsedKey from "#ParsedKey";
import type ParseOptions from "#ParseOptions";
import join from "#path/join";
import type Serialized from "#Serialized";
import type Dict from "@rcompat/type/Dict";

export default class OmitType<
  P extends Dict<Parsed<unknown>>,
  K extends keyof P,
> extends GenericType<
  Omit<P, K>,
  Omit<{ [Key in keyof P]: Infer<P[Key]> }, K>,
  "OmitType"
> {
  #properties: Omit<P, K>;

  constructor(type: ObjectType<P>, keys: K[]) {
    super();
    const props = { ...type.properties };
    for (const key of keys) {
      delete props[key];
    }
    this.#properties = props as Omit<P, K>;
  }

  get name() {
    return "omit" as const;
  }

  parse(x: unknown, options: ParseOptions = {}): Infer<this> {
    if (typeof x !== "object" || x === null) {
      throw new Error("Expected object");
    }
    const result: any = {};
    const props = this.#properties as Dict<Parsed<unknown>>;
    for (const k in props) {
      const field = props[k];
      const r = field.parse((x as any)[k], {
        ...options, [ParsedKey]: join(options[ParsedKey] ?? "", String(k)),
      });
      if (r !== undefined) {
        result[k] = r;
      }
    }
    return result as never;
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
