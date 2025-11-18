import Runtime from "#Runtime";
import AppError from "@primate/core/AppError";
import TAG from "@primate/core/backend/TAG";
import type BuildApp from "@primate/core/BuildApp";
import fail from "@primate/core/fail";
import log from "@primate/core/log";
import type NextBuild from "@primate/core/NextBuild";
import assert from "@rcompat/assert";
import user from "@rcompat/env/user";
import type FileRef from "@rcompat/fs/FileRef";
import execute from "@rcompat/stdio/execute";
import which from "@rcompat/stdio/which";

const COMMAND = await which("go");
const ENV = {
  GOARCH: "wasm",
  GOCACHE: (await execute(`${COMMAND} env GOCACHE`, {})).replaceAll("\n", ""),
  GOOS: "js",
  HOME: user.HOME,
};
const REPO = "github.com/primate-run/go";
const [MAJOR, MINOR] = TAG.split(".").map(Number);

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
    const version = await execute(`go list -m -f '{{.Version}}' ${REPO}`);
    const trimmed = version.trim();

    const version_match = trimmed.match(/^v?(\d+)\.(\d+)\.(\d+)/);
    if (!version_match) throw fail("invalid version format: {0}", trimmed);

    const [, major, minor] = version_match.map(Number);

    if (major !== MAJOR || minor !== MINOR) {
      throw fail("installed version {0} not in range {1}", trimmed, TAG);
    }

    log.info("using {0} package v{1}.{2}.x", REPO, major, minor);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw fail("{0} dependency not found - run 'go get {0}@v{1}.0'", REPO, TAG);
  }
}

export default class Default extends Runtime {
  async build(app: BuildApp, next: NextBuild) {
    await check_version();

    app.bind(this.fileExtension, async (route, { context }) => {
      assert(context === "routes", "go: only route files are supported");

      const relative = route.debase(app.path.routes);
      const route_id = relative.path.slice(1, -relative.extension.length);

      // create a temporary .go file in the build directory for compilation
      // this is necessary because `go build` requires an actual file on disk
      const build_go_file = app.runpath("wasm", `${route_id}.go`);
      await build_go_file.directory.create({ recursive: true });
      await build_go_file.write(postlude(await route.text(), route_id));

      const wasm = app.runpath("wasm", `${route_id}.wasm`);

      try {
        log.info("compiling {0} to WebAssembly", route);
        await execute(run(wasm, build_go_file), {
          cwd: build_go_file.directory.path,
          env: ENV,
        });
      } catch (error) {
        throw fail("error in module {0}\n{1}", route, error);
      }

      await build_go_file.remove();

      return `
        import wrapper from "@primate/go/wrapper";
        import bytes from "app:wasm/${route_id}.wasm" with { type: "bytes" };
        await wrapper(bytes, ${JSON.stringify(route_id)});
      `;
    });

    return next(app);
  }
}
