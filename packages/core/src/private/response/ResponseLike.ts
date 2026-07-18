import type ResponseFunction from "#response/ResponseFunction";
import type Streamable from "@rcompat/fs/Streamable";
import type { Dict } from "@rcompat/type";

type UnknownResponseFunction = ResponseFunction<unknown, unknown>;

type ResponseLike =
  | string
  | Dict
  | Dict[]
  | Blob
  | ReadableStream
  | Streamable
  | Response
  | UnknownResponseFunction
  | null
  ;

export { ResponseLike as default };
