import type DBStore from "#db/Store";
import configSchema from "#session/schema";
import type SessionFacade from "#session/SessionFacade";
import local_storage from "#session/storage";
import s_config from "#symbol/config";
import type { InferStore, StoreSchema } from "pema";

type ConfigInput = typeof configSchema.input;

type X<T> = { [K in keyof T]: T[K] } & {};
type Infer<S extends StoreSchema> = X<Omit<InferStore<S>, "id" | "session_id">>;

// overload 1: store provided -> typed
export default function session<S extends StoreSchema>(
  config: { store: DBStore<S> } & Partial<ConfigInput>,
): SessionFacade<Infer<S>>;

// overload 2: store omitted -> unknown
export default function session(
  Infer?: Omit<Partial<ConfigInput>, "store">,
): SessionFacade<unknown>;

export default function session<S extends StoreSchema>(
  config?: Partial<ConfigInput> & { store?: DBStore<S> },
): SessionFacade<any> {
  const parsed = configSchema.parse(config ?? {});
  const store = parsed.store;

  // type is inferred from provided store, or unknown for default
  type T = S extends StoreSchema ? Infer<S> : unknown;

  // bind the ALS store to this T
  const storage = local_storage<T>();

  const current = () => {
    const s = storage.getStore();
    if (!s) throw new Error("Session handle not available in this context");
    return s;
  };

  const facade: SessionFacade<T> = {
    get id() {
      return current().id;
    },
    get exists() {
      return current().exists;
    },
    create(initial) {
      current().create(initial);
    },
    get() {
      return current().get();
    },
    try() {
      return current().try();
    },
    set(next) {
      current().set(next);
    },
    destroy() {
      current().destroy();
    },
    get [s_config]() {
      return { ...parsed, store };
    },
  };

  return facade;
}
