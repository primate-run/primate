import type Types from "#db/Types";

type As = {
  table: string;
  pk: string | null;
  generate_pk?: boolean;
  types: Types;
};

export type { As as default };
