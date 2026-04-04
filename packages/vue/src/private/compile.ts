import presets from "@primate/core/build/presets";
import transform from "@primate/core/build/transform";
import {
  compileScript,
  compileStyle,
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
    is_ts: script?.lang === "ts" || scriptSetup?.lang === "ts",
  };
};

const compile_sfc = (text: string) => {
  const id = crypto.randomUUID().slice(0, id_size);
  const { descriptor } = parse(text);
  const { has_script, inline, is_ts } = analyze(descriptor);

  let module: string;

  if (inline) {
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

  const js = is_ts ? transform(module, presets.typescript).code : module;

  const css = descriptor.styles.map(style =>
    compileStyle({
      filename: "",
      id,
      source: style.content,
      scoped: style.scoped ?? false,
    }).code,
  ).join("\n");

  return { js, css };
};

export default {
  client(text: string) {
    return compile_sfc(text);
  },
  server(text: string) {
    return compile_sfc(text).js;
  },
};
