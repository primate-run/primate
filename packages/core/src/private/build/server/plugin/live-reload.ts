import type BuildApp from "#build/App";
import fail from "#fail";
import type ServeApp from "#serve/App";
import type { Plugin } from "esbuild";

export default function plugin_server_live_reload(app: BuildApp): Plugin {
  let build_n = 0;
  let serve_app: ServeApp | undefined;

  return {
    name: "primate/server/live-reload",
    setup(build) {
      build.onEnd(async (result) => {
        // don't do anything on errors
        if (result.errors.length) return;
        // we expect a single bundled file
        const outFile = result.outputFiles?.[0];
        if (!outFile) return;

        const filename = `server.${build_n}.js`;
        const s = app.path.build.join(filename);
        await s.write(outFile.text);

        try {
          // stop old app
          if (serve_app !== undefined) serve_app.stop();
          serve_app = (await s.import()).default as ServeApp;

          const stamp = app.runpath("client", "server-stamp.js");
          await stamp.write(`export default ${build_n};\n`);

          build_n++;
        } catch (err) {
          fail("[primate/server/live-reload] failed to import {0}", filename);
          console.error(err);
        }
      });
    },
  };
}

