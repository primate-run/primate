import E from "#errors";
import type { Input } from "#module";
import module from "#module";
import type { Module } from "@primate/core";
import log from "@primate/core/log";
import server from "@primate/core/server";
import assert from "@rcompat/assert";
import env from "@rcompat/env";
import { CodeError } from "@rcompat/error";
import type { FileRef } from "@rcompat/fs";
import io from "@rcompat/io";

const COMMAND = await io.which("go");
const ENV = {
  GOARCH: "wasm",
  GOCACHE: (await io.run(`${COMMAND} env GOCACHE`, {})).replaceAll("\n", ""),
  GOOS: "js",
  HOME: env.get("HOME"),
};

const REPO = "github.com/primate-run/go";
const [MAJOR, MINOR] = server.TAG.split(".").map(Number);

const run = (wasm: FileRef, go: FileRef) =>
  `${COMMAND} build -o ${wasm.name} ${go.name}`;

function postlude(code: string, route_id: string) {
  if (!code.includes(`${REPO}/route`)) {
    log.warn("Go file does not import {0} - skipping route registration", REPO);
    return code;
  }

  return `${code}
func main() {
    route.Commit("${route_id}")
    select{}
}`;
}

async function check_version() {
  try {
    const version = (await io.run(`go list -m -f '{{.Version}}' ${REPO}`)).trim();

    const version_match = version.match(/^v?(\d+)\.(\d+)\.(\d+)/);
    if (version_match == null) throw E.invalid_version_format(version);

    const [, major, minor] = version_match.map(Number);

    if (major !== MAJOR || minor !== MINOR) {
      throw E.version_not_in_range(version, server.TAG);
    }

    log.info("using {0} package v{1}.{2}.x", REPO, major, minor);
  } catch (error) {
    if (CodeError.is(error)) throw error;
    const command = `go get ${REPO}@v${server.TAG}.0`;
    throw E.dependency_not_found(REPO, command);
  }
}

function wrap(route_id: string) {
  return `
  import wrapper from "@primate/go/wrapper";
  import bytes from "app:wasm/${route_id}.wasm" with { type: "bytes" };
  import i18n from "app:config:i18n";
  import session from "app:config:session";
  await wrapper(bytes, ${JSON.stringify(route_id)}, { i18n, session });
`;
}

export default function default_module(input: Input = {}): Module {
  const { extension = module.extension } = module.schema.parse(input);

  return {
    name: module.name,

    setup({ onBuild }) {
      onBuild(async app => {
        await check_version();

        app.bind(extension, async (route, { context }) => {
          assert.true(context === "routes", E.only_route_files());

          const relative = route.debase(app.path.routes);
          const route_id = relative.path.slice(1, -relative.extension.length);

          const build_go_file = app.runpath("wasm", `${route_id}.go`);
          await build_go_file.directory.create();
          await build_go_file.write(postlude(await route.text(), route_id));

          const wasm = app.runpath("wasm", `${route_id}.wasm`);

          try {
            log.info("compiling {0} to WebAssembly", route);
            await io.run(run(wasm, build_go_file), {
              cwd: build_go_file.directory.path,
              env: ENV,
            });
          } catch (error) {
            throw E.backend_error(route, error as Error);
          }

          await build_go_file.remove();

          return wrap(route_id);
        });
      });
    },
  };
}
