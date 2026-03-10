import type { Dict } from "@rcompat/type";

type RequestView = {
  context: Dict;
  cookies: Dict<string>;
  headers: Dict<string>;
  path: Dict<string>;
  query: Dict<string>;
  url: URL;
};

export type { RequestView as default };;
