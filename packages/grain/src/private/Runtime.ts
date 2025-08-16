import Module from "@primate/core/backend/Module";
import pema from "pema";
import array from "pema/array";
import boolean from "pema/boolean";
import string from "pema/string";
import which from "@rcompat/stdio/which";

const default_grain = await which("grain");

const schema = pema({
  command: string.default(default_grain),
  extension: string.optional(),
  includeDirs: array(string).optional(),
  noPervasives: boolean.default(false),
  stdlib: string.optional(),
  strictSequence: boolean.default(false),
});

export default class Runtime extends Module {
  #config = schema.infer;
  name = "grain";
  defaultExtension = ".gr";

  static input = schema.input;

  constructor(config: typeof Runtime.input = {}) {
    super({ extension: config.extension });

    this.#config = schema.parse(config);
  }

  get config() {
    return { ...this.#config };
  }
}
