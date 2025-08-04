import GenericType from "#GenericType";
import type Infer from "#Infer";
import type InferStore from "#InferStore";
import type StoreSchema from "#StoreSchema";
import ValidatedKey from "#ValidatedKey";
import type ValidationOptions from "#ValidationOptions";

export default class StoreType<T extends StoreSchema>
  extends GenericType<T, InferStore<T>, "StoreType"> {
  #spec: T;

  constructor(spec: T) {
    super();
    this.#spec = spec;
  }

  get name() {
    return "store";
  }

  validate(x: unknown, options: ValidationOptions = {}): Infer<this> {
    const spec = this.#spec;

    if (typeof x !== "object" || x === null) {
      throw new Error("Expected object");
    }
    const result: any = {};
    for (const k in spec) {
      const r = spec[k].validate((x as any)[k], {
        ...options, [ValidatedKey]: `.${k}`,
      });
      // exclude undefined (optionals)
      if (r !== undefined) {
        result[k] = r;
      }
    }

    return x as never;
  }
}
