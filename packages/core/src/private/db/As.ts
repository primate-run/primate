import type Types from "#db/Types";
import type PK from "#db/PK";

type As = {
  table: string;
  pk: PK;
  generate_pk?: boolean;
  types: Types;
};

export type { As as default };
