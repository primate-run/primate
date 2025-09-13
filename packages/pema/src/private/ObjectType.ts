import GenericType from "#GenericType";
import type Infer from "#Infer";
import type InferInputSchema from "#InferInputSchema";
import type Parsed from "#Parsed";
import type ParseOptions from "#ParseOptions";
import next from "#path/next";
import type Serialized from "#Serialized";
import type Dict from "@rcompat/type/Dict";
import type Newable from "@rcompat/type/Newable";

export default class ObjectType<P extends Dict<Parsed<unknown>>>
  extends GenericType<P, { [K in keyof P]: P[K]["infer"] }, "ObjectType"> {
  #properties: P;
  #options: ParseOptions;

  constructor(properties: P, options: ParseOptions = {}) {
    super();
    this.#properties = properties;
    this.#options = options;
  }

  get name() {
    const props = Object.entries(this.#properties)
      .map(([k, v]) => `${k}: ${v.name}`)
      .join(", ");
    return `{ ${props} }`;
  }

  get properties() {
    return this.#properties;
  }

  get input() {
    return undefined as InferInputSchema<P>;
  }

  #derive(next: ParseOptions): this {
    const Constructor = this.constructor as Newable<this>;
    return new Constructor(this.#properties, { ...this.#options, ...next });
  }

  get coerce() {
    return this.#derive({ coerce: true });
  }

  parse(x: unknown, options: ParseOptions = {}): Infer<this> {
    const $options = { ...this.#options, ...options };

    let _x = x;
    if (typeof x !== "object" || x === null) {
      _x = {};
    }

    const out: Dict = {};
    for (const k in this.#properties) {
      const parsed = this.#properties[k].parse((_x as any)[k], next(k, $options));
      if (parsed !== undefined) {
        out[k] = parsed;
      }
    }
    return out as never;
  }

  toJSON() {
    const properties: Dict<Serialized> = {};
    for (const [k, v] of Object.entries(this.#properties)) {
      properties[k] = v.toJSON();
    }
    return { type: "object" as const, properties };
  }
}
