import Module from "#module/Module";
import hash from "@rcompat/crypto/hash";
import pema from "pema";
import boolean from "pema/boolean";
import string from "pema/string";

export default abstract class FrontendModule extends Module {
  #extension?: string;
  #options: typeof FrontendModule.options;

  static schema = pema({
    ssr: boolean.default(true),
    spa: boolean.default(true),
  });

  static options = FrontendModule.schema.infer;

  constructor(extension?: string, options?: typeof FrontendModule.options) {
    super();

    this.#extension = string.optional().validate(extension);
    this.#options = FrontendModule.schema.validate(options);
  }

  get extension() {
    return this.#extension ?? `.${this.name}`;
  }

  get package() {
    return `@primate/${this.name}`;
  }

  get rootname() {
    return `root_${this.name}`;
  }

  get ssr() {
    return this.#options.ssr;
  }

  get spa() {
    return this.#options.spa;
  }

  async normalize(path: string) {
    return `${this.name}_${await hash(path)}`;
  }
}
