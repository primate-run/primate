import borrow from "@primate/python/borrow";
import helpers from "@primate/python/helpers";
import pyodide from "@primate/python/pyodide";
import to_request from "@primate/python/to-request";
import to_response from "@primate/python/to-response";
import session from "primate/config/session";
import route from "primate/route";
import type { PyodideAPI } from "pyodide";

const messageCallback = () => { };

let _micropip: Promise<any> | null = null;
const installed = new Set<string>();

async function load_micropip(python: PyodideAPI) {
  if (!_micropip) {
    _micropip = (async () => {
      await python.loadPackage("micropip", { messageCallback });
      return python.pyimport("micropip");
    })();
  }
  return _micropip;
}

async function load_package(micropip: any, pkg: string) {
  if (installed.has(pkg)) return;
  await micropip.install(pkg, { messageCallback });
  installed.add(pkg);
}

export default async function wrapper(
  source: string,
  packages: string[],
  primate_run: string,
  id: string,
) {
  const python = await pyodide();
  const micropip = await load_micropip(python);
  const route_id = JSON.stringify(id);

  await load_package(micropip, primate_run);
  for (const pkg of packages) {
    await load_package(micropip, pkg);
  }

  await python.runPython(`
    from primate import Route
    Route.clear(${route_id})
    Route.scope(${route_id})
  `);

  await python.runPython(source);

  const verbs = python.runPython(`
    from primate import Route
    list(Route.registry(${route_id}).keys())
  `).toJs() as string[];

  const wrapped_session = {
    get id() {
      return session().id;
    },
    get exists() {
      return session().exists;
    },
    create(initial: any) {
      session().create(borrow(initial));
    },
    get() {
      return session().get();
    },
    try() {
      return session().get();
    },
    set(data: any) {
      session().set(borrow(data));
    },
    destroy() {
      session().destroy();
    },
  };

  for (const verb of verbs) {
    (route as any)[verb.toLowerCase()](async (request: any) => {
      python.globals.set("js_req", await to_request(request));
      python.globals.set("helpers_obj", helpers);
      python.globals.set("session_obj", wrapped_session);
      const verb_str = JSON.stringify(verb);

      try {
        const result = await python.runPythonAsync(`
          from primate import Route
          await Route.call_js(${route_id}, ${verb_str}, js_req, helpers_obj, session_obj)
        `);

        return to_response(result);
      } catch (e: any) {
        console.error(`python error (${verb.toLowerCase()})`, e);
        return { status: 500, body: "Python execution error: " + e.message };
      } finally {
        python.globals.delete("js_req");
        python.globals.delete("helpers_obj");
        python.globals.delete("session_obj");
      }
    });
  }

}
