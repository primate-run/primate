import pema from "pema";
import string from "pema/string";
import Status from "primate/http/Status";
import route from "primate/route";

const Header = pema({
  "content-type": string.optional(),
  authorization: string.startsWith("Bearer ").optional(),
});

route.get(request => {
  const headers = request.headers.parse(Header);
  const token = headers.authorization?.slice("Bearer ".length);
  const status = token ? Status.NO_CONTENT : Status.UNAUTHORIZED;

  return new Response(null, { status });
});
