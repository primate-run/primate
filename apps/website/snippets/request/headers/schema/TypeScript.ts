import p from "pema";
import Status from "primate/http/Status";
import route from "primate/route";

const HeadersSchema = p({
  "content-type": p.string.optional(),
  authorization: p.string.startsWith("Bearer ").optional(),
});

route.get(request => {
  const headers = request.headers.parse(HeadersSchema);
  const token = headers.authorization?.slice("Bearer ".length);
  const status = token ? Status.NO_CONTENT : Status.UNAUTHORIZED;

  return new Response(null, { status });
});
