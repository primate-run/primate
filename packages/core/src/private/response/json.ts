import response from "#response";
import http from "@rcompat/http";

/**
 * Issue a JSON response
 * @param body body object
 * @param options response options
 * @return Response rendering function
 */
export default response<unknown>(http.MIME.APPLICATION_JSON, JSON.stringify);
