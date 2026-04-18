import type { RequestContentType } from "@primate/core/index";
import helpers from "@primate/ruby/helpers";
import ruby from "@primate/ruby/ruby";
import to_request from "@primate/ruby/to-request";
import to_response from "@primate/ruby/to-response";
import wasi from "@primate/ruby/wasi";
import type { RbValue, RubyVM } from "@ruby/wasm-wasi/dist/vm";
import type { WASI } from "wasi";

type VMBundle = { vm: RubyVM; wasi: WASI; instance: WebAssembly.Instance };
type RouteEntry = {
  verb: string;
  content_type: RequestContentType | "";
};

let vm_bundle: VMBundle | null = null;
let _gems_loaded = false;
let _runtime_loaded = false;
let _runner: RbValue | null = null;
const installed = new Set<string>();

async function get_vm(root: string): Promise<VMBundle> {
  if (vm_bundle === null) {
    vm_bundle = await wasi(ruby, {
      env: {
        BUNDLE_GEMFILE: "/app/Gemfile",
        BUNDLE_PATH: "/app/vendor/bundle",
      },
      preopens: {
        "/app": root,
      },
    });
  }
  if (!_gems_loaded) {
    _gems_loaded = true;
    await vm_bundle.vm.evalAsync(`
      Dir.glob("/app/vendor/bundle/ruby/*/gems/*/lib").each do |lib_path|
        $LOAD_PATH << lib_path unless $LOAD_PATH.include?(lib_path)
      end
    `);
  }
  return vm_bundle;
}

async function ensure_runtime(vm: RubyVM) {
  if (_runtime_loaded) return;
  await vm.evalAsync("require 'primate/route'");
  await vm.evalAsync("require 'primate/i18n'");
  _runtime_loaded = true;
}

async function get_runner(vm: RubyVM): Promise<RbValue> {
  if (_runner) return _runner;
  await vm.evalAsync(`
    unless defined?(__primate_run)
      def __primate_run(js_request, helpers, session_obj, i18n_obj, verb_str, route_id)
        Route.call_js(route_id, verb_str, js_request, helpers, session_obj, i18n_obj)
      end
    end
  `);
  _runner = vm.eval("method(:__primate_run)") as unknown as RbValue;
  return _runner;
}

async function get_entries(vm: RubyVM, routeId: string): Promise<RouteEntry[]> {
  const result = await vm.evalAsync(`
    Route.registry(${JSON.stringify(routeId)}).map do |verb, entry|
      { verb: verb, content_type: entry[:content_type].to_s }
    end
  `);
  return result.toJS().map((e: any) => ({
    verb: e.verb.toString(),
    content_type: e.content_type.toString(),
  }));
}

function wrap_session(session: any) {
  if (!session) return null;
  return {
    get id() { return session.id; },
    get exists() { return session.exists; },
    create(initial: any) { session.create(initial); },
    get() { return session.get(); },
    try() { return session.try(); },
    set(data: any) { session.set(data); },
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

async function wrapper(
  source: string,
  route_id: string,
  context: { i18n?: any; session?: any } = {},
  root: string,
): Promise<Record<string, (request: any) => Promise<any>>> {
  const { vm } = await get_vm(root);
  await ensure_runtime(vm);

  await vm.evalAsync(`
    Route.clear(${JSON.stringify(route_id)})
    Route.scope(${JSON.stringify(route_id)})
  `);
  await vm.evalAsync(source);

  const entries = await get_entries(vm, route_id);
  const runner = await get_runner(vm);

  const wrapped_session = wrap_session(context.session);
  const wrapped_i18n = wrap_i18n(context.i18n);

  return Object.fromEntries(
    entries
      .filter(({ verb }) => {
        const key = `${route_id}:${verb}`;
        if (installed.has(key)) return false;
        installed.add(key);
        return true;
      })
      .map(({ verb, content_type }) => [
        verb.toLowerCase(),
        async (request: any) => {
          const jsReq = await to_request(request, content_type);
          try {
            const r = await runner.callAsync(
              "call",
              vm.wrap(jsReq),
              vm.wrap(helpers),
              vm.wrap(wrapped_session),
              vm.wrap(wrapped_i18n),
              vm.wrap(verb),
              vm.wrap(route_id),
            );
            const js_result = (typeof r === "object" && r !== null && "toJS" in r)
              ? r.toJS()
              : r;
            return to_response(js_result);
          } catch (e: any) {
            console.error(`ruby error (${verb.toLowerCase()})`, e);
            return { status: 500, body: "Ruby execution error: " + e.message };
          }
        },
      ]),
  );
}

export default wrapper;
