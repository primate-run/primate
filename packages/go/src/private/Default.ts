import Runtime from "#Runtime";
import AppError from "@primate/core/AppError";
import TAG from "@primate/core/backend/TAG";
import type BuildApp from "@primate/core/BuildApp";
import fail from "@primate/core/fail";
import location from "@primate/core/location";
import log from "@primate/core/log";
import type NextBuild from "@primate/core/NextBuild";
import assert from "@rcompat/assert";
import user from "@rcompat/env/user";
import type FileRef from "@rcompat/fs/FileRef";
import runtime from "@rcompat/runtime";
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

function wrapper(path: string) {
  return `
import env from "@primate/go/env";
import toRequest from "@primate/go/to-request";
import to_response from "@primate/go/to-response";
import session from "#session";
import route from "primate/route";

globalThis.PRMT_SESSION = {
  get exists() {
    return session.exists;
  },
  get id() {
    return session.id;
  },
  get data() {
    return JSON.stringify(session.try());
  },
  create(data) {
    session.create(JSON.parse(data));
  },
  get() {
    return JSON.stringify(session.get());
  },
  try() {
    return JSON.stringify(session.try());
  },
  set(data) {
    session.set(JSON.parse(data));
  },
  destroy() {
    session.destroy();
  },
};

${(runtime as "bun" | "deno" | "node") === "bun"
      ? `import route_path from "./${path}" with { type: "file" };
const binary = await Bun.file(route_path).arrayBuffer();`
      : `import FileRef from "primate/runtime/FileRef";
const buffer = await FileRef.arrayBuffer(import.meta.url+"/../${path}");
const binary = new Uint8Array(buffer);`
    }


env();

// Run Go once to register routes and get available verbs
const go = new globalThis.Go();
const result = await WebAssembly.instantiate(binary, go.importObject);
go.run(result.instance);
const verbs = globalThis.__primate_verbs || [];

for (const verb of verbs) {
  route[verb.toLowerCase()](async request => {
    const requested = await toRequest(request);
    const _go = new globalThis.Go();
    return WebAssembly.instantiate(binary, {..._go.importObject}).then(_result => {
      _go.run(_result.instance);
      return to_response(globalThis.__primate_handle(verb, requested));
    });
  });
}
`;
};

function postlude(code: string) {
  if (!code.includes(`${REPO}/route`)) {
    log.warn("Go file does not import {0} - skipping route registration", REPO);
    return code;
  }
  return `${code}
func main() {
    route.Commit()
    select{}
}`;
};

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
  } catch (error) {
    if (error instanceof AppError) throw error;

    console.log(error);

    throw fail("{0} dependency not found - run 'go get {0}@v{1}.0'", REPO, TAG);
  }
}

export default class Default extends Runtime {
  async build(app: BuildApp, next: NextBuild) {
    await check_version();

    app.bind(this.fileExtension, async (route, { context }) => {
      assert(context === "routes", "go: only route files are supported");

      const relative = route.debase(app.path.routes);
      const basename = relative.path.slice(1, -relative.extension.length);
      const code = postlude(await route.text());
      const build_go_file = app.runpath(location.routes, `${basename}.go`);
      await build_go_file.directory.create({ recursive: true });
      await build_go_file.write(code);

      const wasm = app.runpath(location.routes, `${basename}.wasm`);
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

      return wrapper(wasm.name);
    });

    return next(app);
  }
}
