import type Loader from "#Loader";
import type NativePlatform from "#NativePlatform";
import platforms from "#platforms";
import type App from "@primate/core/App";
import type BuildApp from "@primate/core/BuildApp";
import log from "@primate/core/log";
import Module from "@primate/core/Module";
import type Next from "@primate/core/Next";
import type NextBuild from "@primate/core/NextBuild";
import type NextServe from "@primate/core/NextServe";
import type ServeApp from "@primate/core/ServeApp";
import dim from "@rcompat/cli/color/dim";
import execute from "@rcompat/stdio/execute";
import pema from "pema";
import boolean from "pema/boolean";
import string from "pema/string";

const command = "bun build build/serve.js --conditions=runtime --compile --minify";

const names = platforms.map(platform => platform.name);

const schema = pema({
  start: string.default("/"),
  debug: boolean.default(false),
});

export default class NativeModule extends Module {
  name = "native";
  #config: typeof schema.infer;

  static input = schema.input;

  constructor(config: typeof schema.input) {
    super();

    this.#config = schema.validate(config);
  }

  init<T extends App>(app: T, next: Next<T>) {
    platforms.forEach(platform => app.platform.add(platform));

    return next(app);
  }

  build(app: BuildApp, next: NextBuild) {
    if (names.includes(app.platform.name)) {
      app.done(async () => {
        const { flags, exe } = app.platform.get() as NativePlatform;
        const executable_path = dim(`${app.path.build}/${exe}`);
        await execute(`${command} ${flags} --outfile build/${exe}`);
        log.system("executable written to {0}", executable_path);
      });
    }

    return next(app);
  }

  serve(app: ServeApp, next: NextServe) {
    if (names.includes(app.platform.name)) {
      const Webview = app.loader<Loader>().webview;
      const webview = new Webview({ debug: this.#config.debug });
      const { host, port } = app.config("http");
      webview.navigate(`http://${host}:${port}${this.#config.start}`);
      webview.run();
      webview.closed(() => {
        app.stop();
      });
    }

    return next(app);
  }
}
