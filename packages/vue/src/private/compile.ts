import presets from "@primate/core/build/presets";
import transform from "@primate/core/build/transform";
import {
  compileScript,
  compileTemplate,
  parse,
  type SFCDescriptor,
} from "vue/compiler-sfc";

const genDefaultAs = "__SCRIPT__";
const id_size = 8;

const analyze = ({ script, scriptSetup }: SFCDescriptor) => {
  return {
    has_script: script !== null || scriptSetup !== null,
    inline: scriptSetup !== null,
    is_typescript: script?.lang === "ts" || scriptSetup?.lang === "ts",
  };
};

export default {
  server(text: string) {
    const id = crypto.randomUUID().slice(0, id_size);
    const { descriptor } = parse(text);
    const { has_script, inline, is_typescript } = analyze(descriptor);

    let module: string;

    if (inline) {
      // for <script setup>, compile with inlineTemplate to get both script and
      // render
      const script = compileScript(descriptor, {
        genDefaultAs,
        id,
        inlineTemplate: true,
      });
      module = `
        ${script.content}
        export default { ...__SCRIPT__ };
      `;
    } else {
      // For regular components, compile template and script separately
      const template = compileTemplate({
        filename: "",
        id,
        source: descriptor.template?.content ?? "",
      });
      const script = has_script
        ? compileScript(descriptor, { genDefaultAs, id, inlineTemplate: false })
        : { content: `const ${genDefaultAs} = {}` };

      module = `
        ${template.code}
        ${script.content}
        export default { ...__SCRIPT__, render };
      `;
    }

    return is_typescript ? transform(module, presets.typescript).code : module;
  },
};
