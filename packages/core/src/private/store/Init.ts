import type DB from "#db/DB";
import type StoreInput from "#store/StoreInput";
import type { Dict } from "@rcompat/type";

type Init<
  S extends StoreInput,
  N extends string,
> = {
  table: N;
  db: DB;
  id?: symbol;
  schema: S;
  migrate?: boolean;
  extend?: Dict;
};

export type { Init as default };
