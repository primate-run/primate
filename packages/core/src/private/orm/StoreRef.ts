import type Store from "#orm/Store";
import type { StoreSchema } from "pema";

type StoreRef<S extends StoreSchema = StoreSchema> =
  | Store<S>
  | (() => Store<S>);

export type { StoreRef as default };
