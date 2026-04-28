import p from "pema";
import http from "@rcompat/http";
import route from "primate/route";

const HeadersSchema = p({
  "content-type": p.string.optional(),
  authorization: p.string.startsWith("Bearer ").optional(),
});

export default route({
  get(request) {
    const headers = request.headers.parse(HeadersSchema);
    const token = headers.authorization?.slice("Bearer ".length);
    const status = token ? http.Status.NO_CONTENT : http.Status.UNAUTHORIZED;

    return new Response(null, { status });
  },
});
