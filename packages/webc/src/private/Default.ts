import Runtime from "#Runtime";
import fail from "@primate/core/fail";
import type { FileRef } from "@rcompat/fs";

const script_re = /(?<=<script)>(?<code>.*?)(?=<\/script>)/gus;
const webc_class_name_re = /export default class (?<name>.*?) extends/u;

export default class Default extends Runtime {
  compile = {
    client: async (text: string, view: FileRef) => {
      const [script] = [...text.matchAll(script_re)]
        .map(({ groups }) => groups!.code);
      const { name } = script.match(webc_class_name_re)?.groups
        ?? { name: undefined };

      if (name === undefined) throw fail("view at {0} has no class name", view);

      const tag = (await this.normalize(view
        .debase(view.directory, "/").path)).replace("_", "-");

      const js = `${script}
        globalThis.customElements.define("${tag}", ${name});
      `;

      return { js };
    },
    normalize: this.normalize,
    server: (text: string) => {
      const [code] = [...text.matchAll(script_re)]
        .map(({ groups }) => groups!.code);
      return code;
    },
  };
}
