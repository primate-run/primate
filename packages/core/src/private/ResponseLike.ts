import type ResponseFunction from "#ResponseFunction";
import type Dict from "@rcompat/type/Dict";
import type MaybePromise from "@rcompat/type/MaybePromise";

type ResponseLike = MaybePromise<
  string |
  Dict |
  Dict[] |
  URL |
  ReadableStream |
  Blob |
  Response |
  ResponseFunction>;

export { ResponseLike as default };
