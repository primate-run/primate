import type DB from "#db/DB";
import type { Relation } from "#store/relation";
import type StoreInput from "#store/StoreInput";
import type { Dict } from "@rcompat/type";

type Init<
  S extends StoreInput,
  R extends Dict<Relation>,
> = {
  table: string;
  db: DB;
  id?: symbol;
  schema: S;
  relations?: R;
  migrate?: boolean;
  extend?: Dict;
};

export type { Init as default };
