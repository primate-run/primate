import Runtime from "#Runtime";
import AppError from "@primate/core/AppError";
import TAG from "@primate/core/backend/TAG";
import type BuildApp from "@primate/core/BuildApp";
import fail from "@primate/core/fail";
import log from "@primate/core/log";
import type NextBuild from "@primate/core/NextBuild";
import assert from "@rcompat/assert";
import FileRef from "@rcompat/fs/FileRef";
import execute from "@rcompat/stdio/execute";

const PACKAGE = "primate-run";
const [MAJOR, MINOR] = TAG.split(".").map(Number);

const wrapper = async (fileRef: FileRef, packages: string[]) => {
  const userPythonRaw = await fileRef.text();
  const user_code = userPythonRaw.replace(/`/g, "\\`").replace(/\\/g, "\\\\");
  return `
import route from "primate/route";
import to_request from "@primate/python/to-request";
import to_response from "@primate/python/to-response";
import session from "primate/config/session";
import helpers from "@primate/python/helpers";
import pyodide from "@primate/python/pyodide";
import borrow from "@primate/python/borrow";

const wrapped_session = {
  get id() {
    return session().id;
  },
  get exists() {
    return session().exists;
  },
  create(initial) {
    session().create(borrow(initial));
  },
  get() {
    return session().get();
  },
  try() {
    return session().get();
  },
  set(data) {
    session().set(borrow(data));
  },
  destroy() {
    session().destroy();
  },
};

const python = await pyodide();
const messageCallback = () => {};
await python.loadPackage("micropip", { messageCallback });
const micropip = python.pyimport("micropip");
await micropip.install("${PACKAGE}~=${TAG}.0", { messageCallback });
${packages.map(p => `await micropip.install("${p}", { messageCallback });`)
      .join("\n")}

await python.runPython(\`${user_code}\`);

const registry = python.runPython("Route.registry()").toJs();

await python.runPython(\`
\${Object.keys(registry).map(route => \`
def run_\${route.toUpperCase()}(js_request, helpers_obj, session_obj):
    Route.set_session(session_obj, helpers_obj)
    request = Route.Request(js_request, helpers_obj)
    return Route.call_route("\${route.toUpperCase()}", request)
\`).join("\\n")}
\`);

for (const [verb, func_name] of Object.entries(registry)) {
  const route_fn = python.globals.get(\`run_\${verb.toUpperCase()}\`);
  route[verb.toLowerCase()](async request => {
    try {
      const converted_request = await to_request(request);
      const result = await route_fn(converted_request, helpers, wrapped_session);
      return to_response(result);
    } catch (e) {
      console.error(\`python error (\${verb.toLowerCase()})\`, e);
      return { status: 500, body: "Python execution error: " + e.message };
    }
  });
}
`;
};

function package_not_found() {
  return fail("package not found - run 'pip install {0}~={1}.0'", PACKAGE, TAG);
}

function pkg_mismatch(major: number, minor: number) {
  return fail("installed {0} package version {1}.{2}.x not in range ~> {3}.x",
    PACKAGE, major, minor, TAG);
}

async function check_version() {
  try {
    const output = await execute(`pip show ${PACKAGE} 2>/dev/null`);

    const version_match = output.match(/Version:\s*(\d+)\.(\d+)\.(\d+)/);

    if (!version_match) throw package_not_found();

    const [, major, minor] = version_match.map(Number);

    if (major !== MAJOR || minor !== MINOR) throw pkg_mismatch(major, minor);

    log.info("using {0} package {1}.{2}.x", PACKAGE, major, minor);
  } catch (error) {
    if (error instanceof AppError) throw error;

    throw package_not_found();
  }
}

export default class Default extends Runtime {
  async build(app: BuildApp, next: NextBuild) {
    await check_version();

    const requirements_txt = app.root.join("requirements.txt");
    let packages: string[] = [];
    if (await requirements_txt.exists()) {
      const requirements = await FileRef.text(requirements_txt);
      packages = requirements
        .split("\n")
        .filter(line => line.trim() && !line.startsWith("#"))
        .map(p => p.trim());
    }

    app.bind(this.fileExtension, async (route, { context }) => {
      assert(context === "routes", "python: only route files are supported");
      return await wrapper(route, packages);
    });

    return next(app);
  }
}
