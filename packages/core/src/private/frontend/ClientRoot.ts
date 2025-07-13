import type Props from "#frontend/Props";
import type Dictionary from "@rcompat/type/Dictionary";

type ClientRoot = {
  names: string[];
  data: Props[];
  request: Dictionary;
};

export type { ClientRoot as default };
