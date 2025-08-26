type ResponseLike =
  | string
  | Record<string, unknown>
  | Record<string, unknown>[]
  | Blob
  | ReadableStream
  | URL
  | null
  | Response
  ;
