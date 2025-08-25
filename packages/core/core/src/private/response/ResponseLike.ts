import type ResponseFunction from "#response/ResponseFunction";
import type Streamable from "@rcompat/fs/Streamable";
import type Dict from "@rcompat/type/Dict";

type ResponseLike =
  | Blob
  | Dict
  | Dict[]
  | null
  | ReadableStream
  | Response
  | ResponseFunction
  | Streamable
  | string
  | URL
  ;

export { ResponseLike as default };
