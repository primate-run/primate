import response from "#response";
import mime from "@rcompat/http/mime/application/json";

/**
 * Issue a JSON response
 * @param body body object
 * @param options response options
 * @return Response rendering function
 */
export default response<unknown>(mime, JSON.stringify);
