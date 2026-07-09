import type ResponseFunction from "#response/ResponseFunction";
import type Streamable from "@rcompat/fs/Streamable";
import type { Dict } from "@rcompat/type";

type ResponseLike =
  | string
  | Dict
  | Dict[]
  | URL
  | Blob
  | ReadableStream
  | Streamable
  | Response
  | ResponseFunction<any>
  | null
  ;

export { ResponseLike as default };
