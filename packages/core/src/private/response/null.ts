import http from "@rcompat/http";

function $null() {
  return () => new Response(null, { status: http.Status.NO_CONTENT });
}

export default $null;
