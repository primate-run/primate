import Runtime from "#Runtime";
import type BuildApp from "@primate/core/BuildApp";
import type NextBuild from "@primate/core/NextBuild";
import assert from "@rcompat/assert";
import FileRef from "@rcompat/fs/FileRef";

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
await micropip.install("primate-run", { messageCallback });
${packages.map(p => `await micropip.install("${p}", { messageCallback });`).join("\n")}

await python.runPython(\`${user_code}\`);

// Get the registry of registered route function names
const registry = python.runPython("Route.registry()").toJs();

// Create route handler functions
await python.runPython(\`
\${Object.keys(registry).map(route => \`
def run_\${route.toUpperCase()}(js_request, helpers_obj, session_obj):
    Route.set_session(session_obj, helpers_obj)
    request = Route.Request(js_request, helpers_obj)
    return Route.call_route("\${route.toUpperCase()}", request)
\`).join("\\n")}
\`);

// Create route handlers for each registered route
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

export default class Default extends Runtime {
  async build(app: BuildApp, next: NextBuild) {
    const requirements_txt = app.root.join("requirements.txt");
    let packages: string[] = [];

    if (await requirements_txt.exists()) {
      const requirements = await FileRef.text(requirements_txt);
      packages = requirements
        .split("\n")
        .filter(line => line.trim() && !line.startsWith("#"))
        .map(p => p.trim())
        ;
    }

    app.bind(this.fileExtension, async (route, { context }) => {
      assert(context === "routes", "python: only route files are supported");

      return await wrapper(route, packages);
    });

    return next(app);
  }
}
