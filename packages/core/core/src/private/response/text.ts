import response from "#response";
import identity from "@rcompat/function/identity";
import mime from "@rcompat/http/mime/text/plain";

/**
 * Return a plaintext response
 * @param body plaintext body
 * @param options response options
 * @return Response rendering function
 */
export default response<string>(mime, identity);
