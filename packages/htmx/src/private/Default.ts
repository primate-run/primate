import type Options from "#Options";
import Runtime from "#Runtime";
import type Template from "#Template";
import type BuildApp from "@primate/core/BuildApp";
import is from "@rcompat/is";
import string from "@rcompat/string";

const htmx_esm = "htmx-esm";
const _export = `export * from "${htmx_esm}`;

export default class Default extends Runtime {
  #extensions: string[];
  #templates: Template[];
  compile = {
    server: (text: string) => string.dedent`
      import render from "@primate/htmx/render";

      export default props => render(${JSON.stringify(text)}, props);`,
  };

  constructor(options: Options = {}) {
    super({ fileExtensions: options.fileExtensions });

    this.#extensions = options.extensions ?? [];
    this.#templates = options.templates ?? [];
  }

  get #has_templates() {
    return this.#extensions.includes("client-side-templates") &&
      !is.empty(this.#templates);
  }

  publish(app: BuildApp) {
    app.entrypoint(`export { default as htmx } from "${htmx_esm}";`);

    this.#extensions.forEach(extension => {
      app.entrypoint(`export * from "${htmx_esm}/${extension}";`);
    });

    if (this.#has_templates) {
      this.#templates
        .filter(template => template !== "xslt")
        .forEach(template => {
          app.entrypoint(`export * from "${htmx_esm}/templates/${template}";`);
        });
    }
  }
}
