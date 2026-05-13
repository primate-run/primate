import type { Dict, PartialDict } from "@rcompat/type";
type RequestView = {
  context: Dict;
  cookies: PartialDict<string>;
  headers: PartialDict<string>;
  path: PartialDict<string>;
  query: PartialDict<string>;
  url: URL;
};

export type { RequestView as default };
