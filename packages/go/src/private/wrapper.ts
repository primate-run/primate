// @ts-expect-error: user injected
import i18n from "#i18n";
import env from "@primate/go/env";
import toRequest from "@primate/go/to-request";
import to_response from "@primate/go/to-response";
import session from "primate/config/session";
import route from "primate/route";

declare global {
  var Go: {
    new(): {
      importObject: WebAssembly.Imports;
      run(instance: WebAssembly.Instance): Promise<void>;
    };
  };

  var PRMT_SESSION: any;
  var PRMT_I18N: any;
  var __primate_go_initialized: Set<string> | undefined;
}

export default async function wrapper(
  bytes: Uint8Array,
  route_id: string,
): Promise<void> {
  if (!globalThis.__primate_go_initialized) {
    globalThis.__primate_go_initialized = new Set();
  }

  globalThis.PRMT_SESSION = {
    get exists() { return session().exists; },
    get id() { return session().id; },
    get data() { return JSON.stringify(session().try()); },
    create(data: string) { session().create(JSON.parse(data)); },
    get() { return JSON.stringify(session().get()); },
    try() { return JSON.stringify(session().try()); },
    set(data: string) { session().set(JSON.parse(data)); },
    destroy() { session().destroy(); },
  };

  globalThis.PRMT_I18N = {
    get locale() { return i18n.locale.get(); },
    t(key: string, params?: string) {
      if (!params) return i18n(key);
      return i18n(key, JSON.parse(params));
    },
    set(locale: string) { i18n.locale.set(locale); },
  };

  env();

  const safe_route_id = route_id.replace(/\//g, "_");
  const registry_name = `__primate_go_registry_${safe_route_id}`;
  const call_go = `__primate_call_go_${safe_route_id}`;

  delete (globalThis as any)[registry_name];
  delete (globalThis as any)[call_go];

  await new Promise<void>((resolve) => {
    (globalThis as any)[`__primate_go_ready_${safe_route_id}`] = () => {
      resolve();
    };

    const go = new globalThis.Go();
    WebAssembly.instantiate(bytes, go.importObject).then(result => {
      go.run((result as any).instance).catch(err => {
        console.error("Go runtime error:", route_id, err);
      });
    });
  });

  const registry_fn = (globalThis as any)[registry_name];
  const registry = registry_fn();
  const verbs: string[] = registry?.length
    ? Array.from({ length: registry.length }, (_, i) => registry[i])
    : [];

  for (const verb of verbs) {
    (route as any)[verb.toLowerCase()](async (request: any) => {
      const requested = await toRequest(request);
      const callFn = (globalThis as any)[call_go];
      const response = callFn(verb, requested);
      return to_response(response);
    });
  }

  globalThis.__primate_go_initialized.add(route_id);
}
