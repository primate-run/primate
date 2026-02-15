import type As from "#db/As";
import type ReadArgs from "#db/ReadArgs";
import type ReadRelationsArgs from "#db/ReadRelationsArgs";
import type With from "#db/With";
import type { Dict } from "@rcompat/type";

const UNSIGNED_BIGINT_TYPES = ["u64", "u128"];
const SIGNED_BIGINT_TYPES = ["i128"];
const BIGINT_STRING_TYPES = [...UNSIGNED_BIGINT_TYPES, ...SIGNED_BIGINT_TYPES];
const INT_TYPES = ["u8", "u16", "u32", "i8", "i16", "i32"];

const BASE = {
  withed(args: ReadArgs & { with?: With }): args is ReadRelationsArgs {
    return args.with !== undefined;
  },

  fields(base: string[] | undefined, ...add: (string | null)[]) {
    if (base === undefined) return undefined;
    const set = new Set(base);
    for (const f of add) if (f !== null) set.add(f);
    return [...set];
  },

  project(row: Dict, fields?: string[]) {
    if (fields === undefined || fields.length === 0) return { ...row };
    const out: Dict = {};
    for (const k of fields) if (k in row) out[k] = row[k];
    return out;
  },

  expand(as: As, fields: string[] | undefined, relations: With) {
    const fks = Object.values(relations).flatMap(r => r.reverse ? [r.fk] : []);
    return BASE.fields(fields, as.pk, ...fks);
  },

  BIGINT_STRING_TYPES,
  UNSIGNED_BIGINT_TYPES,
  INT_TYPES,
};

export default BASE;
