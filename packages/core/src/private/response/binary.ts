import response from "#response";
import stream from "@rcompat/fs/stream";
import type Streamable from "@rcompat/fs/Streamable";
import mime from "@rcompat/http/mime/application/octet-stream";

/**
 * Stream a binary response
 * @param body streamable body
 * @param options response options
 * @return Response rendering function
 */
export default response<Streamable<unknown>>(mime, stream);
