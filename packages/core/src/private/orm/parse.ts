import fail from "#fail";
import ForeignKey from "#orm/ForeignKey";
import PrimaryKey from "#orm/PrimaryKey";
import type { StoreInput } from "#orm/types";
import type { Dict } from "@rcompat/type";
import type { DataKey, Storable } from "pema";

const is_pk = (x: unknown): x is PrimaryKey<any> => x instanceof PrimaryKey;
const is_fk = (x: unknown): x is ForeignKey<any> => x instanceof ForeignKey;

export default function parse(input: StoreInput) {
  let pk: string | null = null;
  const fks = new Map<string, ForeignKey<Storable<DataKey>>>();
  const schema: Dict<Storable<DataKey>> = {};

  for (const [name, field] of Object.entries(input)) {
    if (is_pk(field)) {
      if (pk !== null) throw fail("multiple primary keys: {0}, {1}", pk, name);
      pk = name;
      schema[name] = field.type;
    } else if (is_fk(field)) {
      fks.set(name, field);
      schema[name] = field.type;
    } else {
      schema[name] = field;
    }
  }

  return { pk, fks, schema };
}
