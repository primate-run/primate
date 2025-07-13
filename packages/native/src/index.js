import dim from "@rcompat/cli/color/dim";
import execute from "@rcompat/stdio/execute";
import targets from "./targets.js";
import log from "@primate/core/log";

const target_keys = Object.keys(targets);
const command = "bun build build/serve.js --conditions=runtime --compile --minify";

export default ({
  start = "/",
  debug = false,
} = {}) => {
  return {
    name: "primate:native",
    init(app, next) {
      target_keys.forEach(target => app.target(target, targets[target]));
      return next(app);
    },
    build(app, next) {
      if (target_keys.includes(app.build_target)) {
        app.done(async () => {
          const { flags, exe } = targets[app.build_target];
          const executable_path = dim(`${app.path.build}/${exe}`);
          await execute(`${command} ${flags} --outfile build/${exe}`);
          log.system("executable written to {0}", executable_path);
        });
      }
      return next(app);
    },
    async serve(app, next) {
      if (target_keys.includes(app.build_target)) {
        const Webview = app.loader.webview();
        const webview = new Webview(debug);
        const { host, port } = app.config("http");
        webview.navigate(`http://${host}:${port}${start}`);
        webview.run();
        webview.closed(() => {
          app.stop();
        });
      }
      return next(app);
    },
  };
};
