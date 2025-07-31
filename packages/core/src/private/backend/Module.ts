import Module from "#Module";
import pema from "pema";
import string from "pema/string";

export default abstract class BackendModule extends Module {
  abstract defaultExtension: string;
  #options: typeof BackendModule.options;

  static schema = pema({
    extension: string.optional(),
  });

  static options = BackendModule.schema.infer;

  constructor(options?: typeof BackendModule.schema.input) {
    super();

    this.#options = BackendModule.schema.validate(options);
  }

  get extension() {
    return this.#options.extension ?? this.defaultExtension;
  }

  get package() {
    return `@primate/${this.name}`;
  }
}
