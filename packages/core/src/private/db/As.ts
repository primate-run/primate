import type Types from "#db/Types";

type As = {
  name: string;
  pk: string | null;
  generate_pk?: boolean;
  types: Types;
};

export type { As as default };
