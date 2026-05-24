import init from "#init";
import frontend from "@primate/core/frontend";
import string from "@rcompat/string";
import esbuild from "esbuild";

const SCRIPT = /(?<=<script)>(?<code>.*?)(?=<\/script>)/gus;
const REMOVE = /<script>.*?<\/script>/gus;

export default frontend({
  ...init,
  compile: {
    server: async (text: string, file) => {
      const scripts = [...text.matchAll(SCRIPT)]
        .flatMap(({ groups }) => groups?.code !== undefined ? [groups.code] : []);

      let bundled = "";
      if (scripts.length > 0) {
        const code = scripts.join("\n");
        const result = await esbuild.build({
          stdin: {
            contents: code,
            resolveDir: file.directory.path,
          },
          bundle: true,
          write: false,
          format: "esm",
        });
        bundled = result.outputFiles[0].text;
      }

      const body = text.replaceAll(REMOVE, "");
      const script = bundled.length > 0
        ? `<script>${bundled}</script>`
        : "";

      return string.dedent`
        import render from "@primate/html/render";

        export default props => render(${JSON.stringify(script + body)}, props);`;
    },
  },
});
