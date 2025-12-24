import command from "#command";
import type NativeTarget from "#NativeTarget";
import targets from "#targets";
import type App from "@primate/core/App";
import type BuildApp from "@primate/core/BuildApp";
import log from "@primate/core/log";
import Module from "@primate/core/Module";
import type Next from "@primate/core/Next";
import type NextBuild from "@primate/core/NextBuild";
import type NextServe from "@primate/core/NextServe";
import type ServeApp from "@primate/core/ServeApp";
import color from "@rcompat/cli/color";
import io from "@rcompat/io";
import p from "pema";

const names = targets.map(t => t.name);

const schema = p({
  debug: p.boolean.default(false),
  start: p.string.default("/"),
});

export default class NativeModule extends Module {
  name = "native";
  #config: typeof schema.infer;

  static input = schema.input;

  constructor(config: typeof schema.input) {
    super();

    this.#config = schema.parse(config);
  }

  init<T extends App>(app: T, next: Next<T>) {
    targets.forEach(t => app.target.add(t));

    return next(app);
  }

  build(app: BuildApp, next: NextBuild) {
    if (names.includes(app.target.name)) {
      app.done(async () => {
        const { exe, flags } = app.target.get() as NativeTarget;
        const executable_path = color.dim(`${app.path.build}/${exe}`);
        const { host, port } = app.config("http");
        await app.runpath("worker.js").write(`
          import target from "@primate/native/target/${app.target.target}";
          import Webview from "@primate/native/Webview";
          const webview = new Webview({ platform: target });
          webview.navigate("http://${host}:${port}/${this.#config.start}");
          webview.run();
        `);
        await io.run(command({
          exe,
          files: ["server.js", "worker.js"],
          flags,
        }));
        log.system("executable written to {0}", executable_path);
      });
    }

    return next(app);
  }

  serve(app: ServeApp, next: NextServe) {
    if (names.includes(app.target.name)) {
      const worker = new Worker(app.root.join("worker.js").path);
      worker.addEventListener("message", event => {
        if (event.data === "destroyed") {
          app.stop();
        }
      });
    }

    return next(app);
  }
}
