import Runtime from "#Runtime";
import AppError from "@primate/core/AppError";
import type FileRef from "@rcompat/fs/FileRef";

const script_re = /(?<=<script)>(?<code>.*?)(?=<\/script>)/gus;
const webc_class_name_re = /export default class (?<name>.*?) extends/u;

export default class WebComponentsDefaults extends Runtime {
  compile = {
    client: (text: string, component: FileRef) => {
      const [script] = [...text.matchAll(script_re)]
        .map(({ groups }) => groups!.code);
      const { name } = script.match(webc_class_name_re)?.groups
        ?? { name: undefined };

      if (name !== undefined) {
        throw new AppError("Component at {0} has no class name", component);
      }

      const tag = component
        .debase(`${this.components}/`)
        .path.replaceAll("/", "-").slice(0, -this.extension.length);

      const js = `${script}
        globalThis.customElements.define("${tag}", ${name});`;

      return { js, css: null };
    },
  };
}
