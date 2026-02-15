import fail from "#fail";
import ForeignKey from "#orm/ForeignKey";
import PrimaryKey from "#orm/PrimaryKey";
import type { StoreInput } from "#orm/types";
import type { Dict } from "@rcompat/type";
import type { DataKey, Storable } from "pema";
import type PK from "#db/PK";

const is_pk = (x: unknown): x is PrimaryKey<any> => x instanceof PrimaryKey;
const is_fk = (x: unknown): x is ForeignKey<any> => x instanceof ForeignKey;

export default function parse(input: StoreInput) {
  let pk: PK = null;
  let generate_pk = true;
  const fks = new Map<string, ForeignKey<Storable<DataKey>>>();
  const schema: Dict<Storable<DataKey>> = {};

  for (const [key, value] of Object.entries(input)) {
    if (is_pk(value)) {
      if (pk !== null) throw fail("multiple primary keys: {0}, {1}", pk, key);
      pk = key;
      generate_pk = value.generate;
      schema[key] = value.type;
    } else if (is_fk(value)) {
      fks.set(key, value);
      schema[key] = value.type;
    } else {
      schema[key] = value;
    }
  }

  return { pk, generate_pk, fks, schema };
}
