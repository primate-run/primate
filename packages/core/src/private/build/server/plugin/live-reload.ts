import type BuildApp from "#build/App";
import E from "#errors";
import type ServeApp from "#serve/App";
import is from "@rcompat/is";
import type { Plugin } from "esbuild";

export default function plugin_server_live_reload(app: BuildApp): Plugin {
  let build_n = 0;
  let serve_app: ServeApp | undefined;

  return {
    name: "primate/server/live-reload",
    setup(build) {
      build.onEnd(async result => {
        // don't do anything on errors
        if (result.errors.length > 0) return;
        // we expect a single bundled file
        const out_file = result.outputFiles?.[0];
        if (is.undefined(out_file)) return;

        const filename = `server.${build_n}.js`;
        const s = app.path.build.join(filename);
        await s.write(out_file.text);

        try {
          // stop old app
          if (is.defined(serve_app)) serve_app.stop();
          serve_app = (await s.import()).default as ServeApp;

          const stamp = app.runpath("client", "server-stamp.js");
          await stamp.write(`export default ${build_n};\n`);

          build_n++;
        } catch (error) {
          throw E.build_live_reload_failed(filename, error as Error);
        }
      });
    },
  };
}

