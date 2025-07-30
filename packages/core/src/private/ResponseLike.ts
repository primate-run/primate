import type ResponseFunction from "#ResponseFunction";
import type Dict from "@rcompat/type/Dict";

type ResponseLike =
  string |
  Dict |
  Dict[] |
  URL |
  ReadableStream |
  Blob |
  Response |
  ResponseFunction;

export { ResponseLike as default };
