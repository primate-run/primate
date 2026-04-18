import type { RequestContentType } from "@primate/core";
import borrow from "@primate/python/borrow";
import helpers from "@primate/python/helpers";
import pyodide from "@primate/python/pyodide";
import to_request from "@primate/python/to-request";
import to_response from "@primate/python/to-response";
import type { PyodideAPI } from "pyodide";

type RouteEntry = { verb: string; content_type: RequestContentType | "" };

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

function wrap_session(session: any) {
  if (!session) return null;
  return {
    get id() { return session.id; },
    get exists() { return session.exists; },
    create(initial: any) { session.create(borrow(initial)); },
    get() { return session.get(); },
    try_get() { return session.try(); },
    set(data: any) { session.set(borrow(data)); },
    destroy() { session.destroy(); },
  };
}

function wrap_i18n(i18n: any) {
  if (!i18n) return null;
  return {
    get locale() { return i18n.locale.get(); },
    t(key: string, params?: string) {
      if (!params) return i18n(key);
      return i18n(key, JSON.parse(params));
    },
    set(locale: string) { i18n.locale.set(locale); },
  };
}

async function get_entries(python: PyodideAPI, route_id: string): Promise<RouteEntry[]> {
  const result = python.runPython(`
    [{"verb": verb, "content_type": entry["content_type"] or ""}
     for verb, entry in Route.registry(${JSON.stringify(route_id)}).items()]
  `).toJs({ dict_converter: Object.fromEntries });

  return result.map((e: any) => ({
    verb: String(e.verb),
    content_type: String(e.content_type) as RequestContentType | "",
  }));
}

export default async function wrapper(
  source: string,
  packages: string[],
  primate_run: string,
  id: string,
  context: { i18n?: any; session?: any } = {},
): Promise<Record<string, (request: any) => Promise<any>>> {
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

  const entries = await get_entries(python, id);
  const wrapped_session = wrap_session(context.session);
  const wrapped_i18n = wrap_i18n(context.i18n);

  return Object.fromEntries(
    entries.map(({ verb, content_type }) => [
      verb.toLowerCase(),
      async (request: any) => {
        const jsReq = await to_request(request, content_type);
        python.globals.set("js_req", jsReq);
        python.globals.set("helpers_obj", helpers);
        python.globals.set("session_obj", wrapped_session);
        python.globals.set("i18n_obj", wrapped_i18n);

        const verb_str = JSON.stringify(verb);
        try {
          const result = await python.runPythonAsync(`
            from primate import Route
            await Route.call_js(${route_id}, ${verb_str}, js_req, helpers_obj, session_obj, i18n_obj)
          `);
          return to_response(result);
        } catch (e: any) {
          console.error(`python error (${verb.toLowerCase()})`, e);
          return { status: 500, body: "Python execution error: " + e.message };
        } finally {
          python.globals.delete("js_req");
          python.globals.delete("helpers_obj");
          python.globals.delete("session_obj");
          python.globals.delete("i18n_obj");
        }
      },
    ]),
  );
}
