import response from "#response";
import fn from "@rcompat/fn";
import MIME from "@rcompat/http/mime";

/**
 * Return a plaintext response
 * @param body plaintext body
 * @param options response options
 * @return Response rendering function
 */
export default response<string>(MIME.TEXT_PLAIN, fn.identity);
