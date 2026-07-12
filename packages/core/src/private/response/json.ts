import response from "#response";
import type ResponseFunction from "#response/ResponseFunction";
import http from "@rcompat/http";

const json_response = response<unknown>(http.MIME.APPLICATION_JSON, JSON.stringify);

/**
 * Issue a JSON response
 * @param body body object
 * @param options response options
 * @return Response rendering function
 */
export default function json<const T>(
  body: T,
  init?: ResponseInit,
): ResponseFunction<never, T> {
  return json_response(body, init) as never;
}
