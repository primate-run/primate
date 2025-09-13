import GenericType from "#GenericType";
import type Infer from "#Infer";
import type InferStore from "#InferStore";
import ParsedKey from "#ParsedKey";
import type ParseOptions from "#ParseOptions";
import PartialType from "#PartialType";
import join from "#path/join";
import type Serialized from "#Serialized";
import type StoreSchema from "#StoreSchema";
import type Dict from "@rcompat/type/Dict";

export default class StoreType<T extends StoreSchema>
  extends GenericType<T, InferStore<T>, "StoreType"> {
  #properties: T;

  constructor(spec: T) {
    super();
    this.#properties = spec;
  }

  get name() {
    return "store";
  }

  get schema() {
    return this.#properties;
  }

  partial() {
    return new PartialType(this.#properties);
  }

  parse(x: unknown, options: ParseOptions = {}): Infer<this> {
    const spec = this.#properties;

    if (typeof x !== "object" || x === null) {
      throw new Error("Expected object");
    }
    const result: any = {};
    for (const k in spec) {
      const r = spec[k].parse((x as any)[k], {
        ...options, [ParsedKey]: join(options[ParsedKey] ?? "", String(k)),
      });
      // exclude undefined (optionals)
      if (r !== undefined) {
        result[k] = r;
      }
    }

    return x as never;
  }

  toJSON() {
    const properties: Dict<Serialized> = {};
    for (const [k, v] of Object.entries(this.#properties)) {
      properties[k] = v.toJSON();
    }
    return { type: "object" as const, properties };
  }
}
