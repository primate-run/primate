import command from "#command";
import type { NativeTarget } from "#targets";
import targets from "#targets";
import type { Module } from "@primate/core";
import color from "@rcompat/cli/color";
import io from "@rcompat/io";
import p from "pema";

const Schema = p({
  debug: p.boolean.default(false),
  start: p.string.default("/"),
});

const names = new Set([...targets.map(t => t.name)]);

export default function module(input: typeof Schema.input = {}): Module {
  const options = Schema.parse(input);

  return {
    name: module.name,

    setup({ onInit, onBuild, onServe }) {
      onInit(app => {
        targets.forEach(t => app.target.add(t));
      });

      onBuild(app => {
        if (names.has(app.target.name)) {
          app.done(async () => {
            const { exe, flags } = app.target.get() as NativeTarget;
            const executable_path = color.dim(`${app.path.build}/${exe}`);
            const { host, port } = app.config("http");
            await app.runpath("worker.js").write(`
          import target from "@primate/native/target/${app.target.target}";
          import Webview from "@primate/native/Webview";
          const webview = new Webview({ platform: target });
          webview.navigate("http://${host}:${port}/${options.start}");
          webview.run();
        `);
            await io.run(command({
              exe,
              files: ["server.js", "worker.js"],
              flags,
            }));
            app.log.system`executable written to ${executable_path}`;
          });
        }
      });

      onServe(app => {
        if (names.has(app.target.name)) {
          const worker = new Worker(app.root.join("worker.js").path);
          worker.addEventListener("message", event => {
            if (event.data === "destroyed") {
              app.stop();
            }
          });
        }
      });
    },
  };
}
