import Module from "@primate/core/backend/Module";
import pema from "pema";
import array from "pema/array";
import string from "pema/string";

export default class Runtime extends Module {
  #packages: string[];
  name = "python";
  defaultExtension = ".py";

  static schema = pema({
    fileExtension: string.optional(),
    packages: array(string).optional(),
  });

  static options = Runtime.schema.infer;
  static input = Runtime.schema.input;

  constructor(init: typeof Runtime.input) {
    const { fileExtension, packages } = Runtime.schema.parse(init);

    super({ fileExtension });

    this.#packages = packages ?? [];
  }

  get packages() {
    return [...this.#packages];
  }
}
