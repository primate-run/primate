import Module from "#Module";
import pema from "pema";
import string from "pema/string";

export default abstract class BackendModule extends Module {
  abstract defaultExtension: string;
  #options: typeof BackendModule.options;

  static schema = pema({
    fileExtension: string.optional(),
  });
  static options = BackendModule.schema.infer;
  static input = BackendModule.schema.input;

  constructor(options?: typeof BackendModule.schema.input) {
    super();

    this.#options = BackendModule.schema.parse(options);
  }

  get fileExtension() {
    return this.#options.fileExtension ?? this.defaultExtension;
  }

  get package() {
    return `@primate/${this.name}`;
  }
}
