import type ResponseFunction from "#ResponseFunction";
import type Dict from "@rcompat/type/Dict";

type ResponseLike =
  | Blob
  | Dict
  | Dict[]
  | null
  | ReadableStream
  | Response
  | ResponseFunction
  | string
  | URL
  ;

export { ResponseLike as default };
