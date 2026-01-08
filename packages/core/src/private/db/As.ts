import type Types from "#db/Types";

type As = {
  name: string;
  pk: string | null;
  types: Types;
};

export type { As as default };
