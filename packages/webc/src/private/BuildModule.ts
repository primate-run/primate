import type App from "@primate/core/App";
import BuildError from "@primate/core/BuildError";
import BuildModule from "@primate/core/frontend/BuildModule";
import type Next from "@primate/core/Next";
import type FileRef from "@rcompat/fs/FileRef";

const script_re = /(?<=<script)>(?<code>.*?)(?=<\/script>)/gus;
const webc_class_name_re = /export default class (?<name>.*?) extends/u;

export default class BuildWebComponents extends BuildModule {
  name = "webc";
  #components?: FileRef;

  compile = {
    client: (text: string, component: FileRef) => {
      const [script] = [...text.matchAll(script_re)]
        .map(({ groups }) => groups!.code);
      const { name } = script.match(webc_class_name_re)?.groups
        ?? { name: undefined };

      if (name !== undefined) {
        throw new BuildError(`Component at '${component}' has no class name`);
      }

      const tag = component
        .debase(`${this.#components}/`)
        .path.replaceAll("/", "-").slice(0, -this.extension.length);

      const js = `${script} globalThis.customElements.define("${tag}", ${name});`;

      return { js };
    },
  };

  init<T extends App>(app: T, next: Next<T>) {
    this.#components = app.path.components;

    return next(app);
  }
}
