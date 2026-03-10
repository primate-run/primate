import init from "#init";
import fail from "@primate/core/fail";
import frontend from "@primate/core/frontend";
import hash from "@rcompat/crypto/hash";
import type { FileRef } from "@rcompat/fs";
import fs from "@rcompat/fs";

const script_re = /(?<=<script)>(?<code>.*?)(?=<\/script>)/gus;
const webc_class_name_re = /export default class (?<name>.*?) extends/u;

async function normalize(path: string) {
  const file = fs.ref(path);
  const basename = path.slice(0, -file.fullExtension.length);
  return `p_${await hash(`${basename}.webc`)}`;
}

export default frontend({
  ...init,
  compile: {
    client: async (text: string, view: FileRef) => {
      const [script] = [...text.matchAll(script_re)]
        .map(({ groups }) => groups!.code);
      const { name } = script.match(webc_class_name_re)?.groups
        ?? { name: undefined };
      if (name === undefined) throw fail`view at ${view} has no class name`;
      const tag = (await normalize(view
        .debase(view.directory, "/").path)).replace("_", "-");
      const js = `${script}
        globalThis.customElements.define("${tag}", ${name});
      `;
      return { js };
    },
    server: (text: string) => {
      const [code] = [...text.matchAll(script_re)]
        .map(({ groups }) => groups!.code);
      return code;
    },
  },
});
