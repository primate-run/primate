import type Options from "#Options";
import type Template from "#Template";
import type BuildApp from "@primate/core/BuildApp";
import Runtime from "#Runtime";
import empty from "@rcompat/record/empty";

const htmx_esm = "htmx-esm";
const _export = `export * from "${htmx_esm}`;

export default class HTMX extends Runtime {
  #extensions: string[];
  #templates: Template[];
  compile = {
    server: (text: string) => `
    import escape from "@primate/htmx/escape";

    export default (props = {}, options) => {
      const encoded = JSON.parse(escape(JSON.stringify(props)));
      const keys = Object.keys(encoded);
      const values = Object.values(encoded);
      const text = ${JSON.stringify(text)};
      return new Function(...keys, \`return \\\`\${text}\\\`;\`)(...values);
    }`,
  };

  constructor(options: Options = {}) {
    super({ extension: options.extension });

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
