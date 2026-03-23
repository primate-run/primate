import fail from "#fail";
import GenericType from "#GenericType";
import type Infer from "#Infer";
import type InferInputSchema from "#InferInputSchema";
import type Parsed from "#Parsed";
import type ParseOptions from "#ParseOptions";
import next from "#path/next";
import SE from "#schema-error";
import type Serialized from "#Serialized";
import is from "@rcompat/is";
import type { Dict, Newable, Unpack } from "@rcompat/type";

type ObjectInfer<P extends Dict<Parsed<unknown>>> = {
  [K in keyof P]: P[K]["infer"];
};

export default class ObjectType<
  P extends Dict<Parsed<unknown>>,
  I = ObjectInfer<P>,
> extends GenericType<P, I, "ObjectType"> {
  #properties: P;
  #options: ParseOptions;

  declare readonly Complement: ObjectType<Record<
    Exclude<string, keyof P>, Parsed<unknown>>>;

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

  #derive(options: ParseOptions): this {
    const Constructor = this.constructor as Newable<this>;
    return new Constructor(this.#properties, { ...this.#options, ...options });
  }

  shape<T>() {
    return new ObjectType<P, T>(this.#properties, this.#options);
  }

  extend<E extends {
    [K in keyof E]: K extends keyof P ? never : Parsed<unknown>
  }>(extra: E | ObjectType<E>): ObjectType<Unpack<P & E>> {
    const properties = extra instanceof ObjectType ? extra.properties : extra;
    for (const key of Object.keys(properties)) {
      if (key in this.#properties) throw SE.extend_key_collision(key);
    }
    return new ObjectType(
      { ...this.#properties, ...properties } as Unpack<P & E>,
      this.#options,
    );
  }

  parse(x: unknown, options: ParseOptions = {}): Infer<this> {
    const $options = { ...this.#options, ...options };

    if (is.defined(x) && !is.dict(x)) throw fail("object", x, $options);

    const input = x ?? {};
    const out: Dict = {};
    for (const k in this.#properties) {
      const parsed = this.#properties[k].parse(input[k], next(k, $options));
      if (parsed !== undefined) out[k] = parsed;
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
