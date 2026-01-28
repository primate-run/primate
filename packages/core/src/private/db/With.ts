import type As from "#db/As";
import type DataDict from "#db/DataDict";
import type Sort from "#db/Sort";
import type { Dict } from "@rcompat/type";

type With = Dict<{
  as: As;
  kind: "one" | "many";
  fk: string;
  reverse?: boolean;
  // subquery options (normalized by Store)
  where: DataDict;
  fields?: string[];
  sort?: Sort;
  limit?: number;
}>;

export type { With as default };
