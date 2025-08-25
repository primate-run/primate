import type Options from "#Options";
import Runtime from "#Runtime";
import type Template from "#Template";
import type BuildApp from "@primate/core/BuildApp";
import empty from "@rcompat/record/empty";
import dedent from "@rcompat/string/dedent";

const htmx_esm = "htmx-esm";
const _export = `export * from "${htmx_esm}`;

export default class Default extends Runtime {
  #extensions: string[];
  #templates: Template[];
  compile = {
    server: (text: string) => dedent`
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
      !empty(this.#templates);
  }

  publish(app: BuildApp) {
    app.export(`export { default as htmx } from "${htmx_esm}";`);

    this.#extensions.map(extension => app.export(`${_export}/${extension}";`));

    if (this.#has_templates) {
      this.#templates
        .filter(template => template !== "xslt")
        .map(template => app.export(`${_export}/templates/${template}";`));
    }
  }
}
