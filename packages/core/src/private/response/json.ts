import response from "#response";
import { MIME } from "@rcompat/http";

/**
 * Issue a JSON response
 * @param body body object
 * @param options response options
 * @return Response rendering function
 */
export default response<unknown>(MIME.APPLICATION_JSON, JSON.stringify);
