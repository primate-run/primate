import type ResponseFunction from "#response/ResponseFunction";
import http from "@rcompat/http";

function $null(): ResponseFunction<never> {
  return () => new Response(null, { status: http.Status.NO_CONTENT });
}

export default $null;
