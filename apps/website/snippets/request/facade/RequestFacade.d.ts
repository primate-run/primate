import type Dict from "@rcompat/type/Dict";
import type JSONValue from "@rcompat/type/JSONValue";

type Body =
  | Dict<File | string>
  | JSONValue
  | null
  | string
  ;

interface RequestFacade {
  body: Body;
  context: Dict;
  cookies: Dict<string>;
  headers: Dict<string>;
  pass(to: string): Promise<Response>;
  path: Dict<string>;
  query: Dict<string>;
  request: Request;
  url: URL;
}
