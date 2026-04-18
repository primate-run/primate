import type {
  RequestContentType,
} from "@primate/core";
import env from "@primate/go/env";
import to_request from "@primate/go/to-request";
import to_response from "@primate/go/to-response";

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
  context: { i18n?: any; session?: any },
): Promise<Record<string, (request: any) => Promise<any>>> {
  if (!globalThis.__primate_go_initialized) {
    globalThis.__primate_go_initialized = new Set();
  }

  if (context.session !== undefined) {
    const session = context.session;
    globalThis.PRMT_SESSION = {
      get exists() { return session.exists; },
      get id() { return session.id; },
      get data() { return JSON.stringify(session.try()); },
      create(data: string) { session.create(JSON.parse(data)); },
      get() { return JSON.stringify(session.get()); },
      try() { return JSON.stringify(session.try()); },
      set(data: string) { session.set(JSON.parse(data)); },
      destroy() { session.destroy(); },
    };
  }

  if (context.i18n !== undefined) {
    const i18n = context.i18n;
    globalThis.PRMT_I18N = {
      get locale() { return i18n.locale.get(); },
      t(key: string, params?: string) {
        if (!params) return i18n(key);
        return i18n(key, JSON.parse(params));
      },
      set(locale: string) { i18n.locale.set(locale); },
    };
  }

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
  type Route = { verb: string; contentType: RequestContentType };

  const routes: Route[] = registry?.length
    ? Array.from({ length: registry.length }, (_, i) => ({
      verb: registry[i].verb,
      contentType: registry[i].contentType,
    }))
    : [];

  globalThis.__primate_go_initialized.add(route_id);

  return Object.fromEntries(
    routes.map(({ verb, contentType }) => [verb.toLowerCase(), async (request: any) => {
      const requested = await to_request(request, contentType);
      const callFn = (globalThis as any)[call_go];
      const response = callFn(verb, requested);
      return to_response(response);
    }]),
  );
}
