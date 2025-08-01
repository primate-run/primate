import type Body from "#Body";
import type Dict from "@rcompat/type/Dict";
import type PartialDict from "@rcompat/type/PartialDict";

type PartialStringDict = PartialDict<string>;

type RequestFacade = {
  body: Body;
  context: Dict;
  cookies: PartialStringDict;
  headers: PartialStringDict;
  pass(to: string): Promise<Response>;
  path: PartialStringDict;
  query: PartialStringDict;
  request: Request;
  url: URL;
} & Dict<Dict | unknown>;

export { RequestFacade as default };
