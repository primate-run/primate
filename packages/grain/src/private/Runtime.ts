import Module from "@primate/core/backend/Module";
import log from "@primate/core/log";
import which from "@rcompat/stdio/which";
import pema from "pema";
import array from "pema/array";
import boolean from "pema/boolean";
import string from "pema/string";

let default_grain: string;
try {
  default_grain = await which("grain");
} catch (_) {
  log.error("Could not find a grain executable on path");
  default_grain = "";
}

const schema = pema({
  command: string.default(default_grain),
  fileExtension: string.optional(),
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
    super({ fileExtension: config.fileExtension });

    this.#config = schema.parse(config);
  }

  get config() {
    return { ...this.#config };
  }
}
