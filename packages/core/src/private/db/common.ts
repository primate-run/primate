import type As from "#db/As";
import type ReadArgs from "#db/ReadArgs";
import type ReadRelationsArgs from "#db/ReadRelationsArgs";
import type With from "#db/With";
import type { Dict } from "@rcompat/type";
import type { DataKey } from "pema";

const UNSIGNED_BIGINT_TYPES = ["u64", "u128"];
const SIGNED_BIGINT_TYPES = ["i128"];
const BIGINT_STRING_TYPES = [...UNSIGNED_BIGINT_TYPES, ...SIGNED_BIGINT_TYPES];
const INT_TYPES = ["u8", "u16", "u32", "i8", "i16", "i32"];
const UUID_TYPES = ["uuid", "uuid_v4", "uuid_v7"] as DataKey[];

function uuid_v7() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));

  const ts = BigInt(Date.now());
  bytes[0] = Number((ts >> 40n) & 0xffn);
  bytes[1] = Number((ts >> 32n) & 0xffn);
  bytes[2] = Number((ts >> 24n) & 0xffn);
  bytes[3] = Number((ts >> 16n) & 0xffn);
  bytes[4] = Number((ts >> 8n) & 0xffn);
  bytes[5] = Number(ts & 0xffn);

  bytes[6] = (bytes[6] & 0x0f) | 0x70; // version 7
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant

  const hex = (bytes as any).toHex();

  return (
    hex.slice(0, 8) + "-" +
    hex.slice(8, 12) + "-" +
    hex.slice(12, 16) + "-" +
    hex.slice(16, 20) + "-" +
    hex.slice(20)
  );
}

function generate_uuid(type: typeof UUID_TYPES[number]): string {
  if (type === "uuid_v4") return crypto.randomUUID();
  // "uuid" and "uuid_v7" both use v7 as the best native choice
  return uuid_v7();
}

function is_uuid_type(type: DataKey): type is typeof UUID_TYPES[number] {
  return UUID_TYPES.includes(type);
}

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

  generate_uuid,
  is_uuid_type,

  BIGINT_STRING_TYPES,
  UNSIGNED_BIGINT_TYPES,
  INT_TYPES,
  UUID_TYPES,
};

export default BASE;
