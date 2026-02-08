import type Infer from "#Infer";
import ObjectType from "#ObjectType";
import type ParseOptions from "#ParseOptions";
import PartialType from "#PartialType";
import type StoreSchema from "#StoreSchema";
import fail from "#fail";
import next from "#path/next";
import is from "@rcompat/is";
import type { Dict } from "@rcompat/type";

export default class StoreType<S extends StoreSchema> extends ObjectType<S> {
  #pk: string | null;

  constructor(properties: S, pk: string | null = null) {
    super(properties);
    this.#pk = pk;
  }

  get name() {
    return "store";
  }

  parse(x: unknown, options: ParseOptions = {}): Infer<this> {
    const $options = { ...options };
    if (x !== undefined && !is.dict(x)) throw fail("object", x, $options);
    const input = x ?? {};
    const out: Dict = {};
    for (const k in this.properties) {
      if (k === this.#pk && !(k in input)) continue;
      const parsed = this.properties[k].parse(input[k], next(k, $options));
      if (parsed !== undefined) out[k] = parsed;
    }
    return out as never;
  }

  partial() {
    return new PartialType(this.properties as any);
  }
}
