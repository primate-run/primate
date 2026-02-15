import type DataDict from "#db/DataDict";
import type Sort from "#db/Sort";

export default interface ReadArgs {
  where: DataDict;
  fields?: string[];
  sort?: Sort;
  limit?: number;
}
