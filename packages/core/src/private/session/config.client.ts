import type SessionFacade from "#session/SessionFacade";
import type { InferStore, StoreSchema } from "pema";

type X<T> = { [K in keyof T]: T[K] } & {};
type Infer<S extends StoreSchema> = X<Omit<InferStore<S>, "id" | "session_id">>;
export default function session<S extends StoreSchema>(
): SessionFacade<any> {

  // type is inferred from provided store, or unknown for default
  type T = S extends StoreSchema ? Infer<S> : unknown;

  const facade: SessionFacade<T> = {
    get id() {
      return "";
    },
    get exists() {
      return false;
    },
    create() {
    },
    get() {
      return {} as Readonly<T>;
    },
    try() {
      return {} as Readonly<T>;
    },
    set() {
    },
    destroy() {
    },
  };

  return facade;
}
