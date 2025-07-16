import type Body from "#Body";
import type Dict from "@rcompat/type/Dict";
import type PartialDict from "@rcompat/type/PartialDict";

type PartialStringDict = PartialDict<string>;

type RequestFacade = Dict<Dict | unknown> & {
  context: Dict;
  request: Request;
  url: URL;
  pass(to: string): Promise<Response>;
  headers: PartialStringDict;
  query: PartialStringDict;
  cookies: PartialStringDict;
  path: PartialStringDict;
  body: Body;
};

export { RequestFacade as default };
