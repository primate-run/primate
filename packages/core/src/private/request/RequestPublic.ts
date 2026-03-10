import type { Dict } from "@rcompat/type";

type RequestPublic = {
  cookies: Dict<string>;
  headers: Dict<string>;
  query: Dict<string>;
  url: URL;
};

export type { RequestPublic as default };
