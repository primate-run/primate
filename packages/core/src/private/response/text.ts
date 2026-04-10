import response from "#response";
import fn from "@rcompat/fn";
import http from "@rcompat/http";

/**
 * Return a plaintext response
 * @param body plaintext body
 * @param options response options
 * @return Response rendering function
 */
export default response<string>(http.MIME.TEXT_PLAIN, fn.identity);
