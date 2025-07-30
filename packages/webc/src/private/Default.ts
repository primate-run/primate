import Runtime from "#Runtime";
import AppError from "@primate/core/AppError";
import type FileRef from "@rcompat/fs/FileRef";

const script_re = /(?<=<script)>(?<code>.*?)(?=<\/script>)/gus;
const webc_class_name_re = /export default class (?<name>.*?) extends/u;

export default class Default extends Runtime {
  compile = {
    server: (text: string) => {
      const [code] = [...text.matchAll(script_re)]
        .map(({ groups }) => groups!.code);
      return code;
    },
    normalize: this.normalize,
    client: async (text: string, component: FileRef) => {
      const [script] = [...text.matchAll(script_re)]
        .map(({ groups }) => groups!.code);
      const { name } = script.match(webc_class_name_re)?.groups
        ?? { name: undefined };

      if (name === undefined) {
        throw new AppError("Component at {0} has no class name", component);
      }
      const tag = (await this.normalize(component
        .debase(component.directory, "/").path)).replace("_", "-");

      const js = `${script}
        globalThis.customElements.define("${tag}", ${name});
      `;

      return { js };
    },
  };
}
