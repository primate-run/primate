import helpers from "@primate/ruby/helpers";
import ruby from "@primate/ruby/ruby";
import to_request from "@primate/ruby/to-request";
import to_response from "@primate/ruby/to-response";
import wasi from "@primate/ruby/wasi";
import type { RbValue, RubyVM } from "@ruby/wasm-wasi/dist/vm";
import session from "primate/config/session";
import route from "primate/route";
import type { WASI } from "wasi";

type VMBundle = { vm: RubyVM; wasi: WASI; instance: WebAssembly.Instance };

let _vm_ready: Promise<VMBundle> | null = null;
let _gems_loaded = false;
let _runtime_loaded = false;
let _runner: RbValue | null = null;

const installed = new Set<string>();

async function getVM(): Promise<VMBundle> {
  if (!_vm_ready) {
    _vm_ready = wasi(ruby, {
      env: {
        BUNDLE_GEMFILE: "/app/Gemfile",
        BUNDLE_PATH: "/app/vendor/bundle",
      },
      preopens: {
        "/app": process.cwd(),
      },
    });
  }
  const bundle = await _vm_ready;

  if (!_gems_loaded) {
    _gems_loaded = true;
    await bundle.vm.evalAsync(`
      Dir.glob("/app/vendor/bundle/ruby/*/gems/*/lib").each do |lib_path|
        $LOAD_PATH << lib_path unless $LOAD_PATH.include?(lib_path)
      end
    `);
  }
  return bundle;
}

async function ensure_runtime(vm: RubyVM) {
  if (_runtime_loaded) return;
  await vm.evalAsync("require 'primate/route'");
  _runtime_loaded = true;
}

async function get_runner(vm: RubyVM): Promise<RbValue> {
  if (_runner) return _runner;
  // Define a small stable entrypoint; we cache Method(:__primate_run).
  await vm.evalAsync(`
    unless defined?(__primate_run)
      def __primate_run(js_request, helpers, session_obj, verb_str, route_id)
        Route.call_js(route_id, verb_str, js_request, helpers, session_obj)
      end
    end
  `);
  _runner = vm.eval("method(:__primate_run)") as unknown as RbValue;
  return _runner;
}

async function get_verbs(vm: RubyVM, routeId: string): Promise<string[]> {
  const verbs = await vm.evalAsync(`
    Route.registry(${JSON.stringify(routeId)}).keys
  `);
  return verbs.toJS().map((v: string) => v.toUpperCase());
}

export default async function wrapper(source: string, route_id: string) {
  const { vm } = await getVM();
  await ensure_runtime(vm);

  await vm.evalAsync(`
    Route.clear(${JSON.stringify(route_id)})
    Route.scope(${JSON.stringify(route_id)})
  `);

  await vm.evalAsync(source);

  const verbs = await get_verbs(vm, route_id);

  const runner = await get_runner(vm);

  const wrapped_session = {
    get id() { return session().id; },
    get exists() { return session().exists; },
    create(initial: any) { session().create(initial); },
    get() { return session().get(); },
    try() { return session().get(); },
    set(data: any) { session().set(data); },
    destroy() { session().destroy(); },
  };

  for (const ucverb of verbs) {
    const key = `${route_id}:${ucverb}`;
    if (installed.has(key)) continue; // already registered

    installed.add(key);
    const verb = ucverb.toLowerCase();

    (route as any)[verb](async (request: any) => {
      const jsReq = await to_request(request);
      try {
        const r = await runner.callAsync(
          "call",
          vm.wrap(jsReq),
          vm.wrap(helpers),
          vm.wrap(wrapped_session),
          vm.wrap(ucverb),
          vm.wrap(route_id),
        );
        const js_result = (typeof r === "object" && r !== null && "toJS" in r)
          ? r.toJS()
          : r;

        return to_response(js_result);
      } catch (e: any) {
        console.error(`ruby error (${verb})`, e);
        return { status: 500, body: "Ruby execution error: " + e.message };
      }
    });
  }
}
