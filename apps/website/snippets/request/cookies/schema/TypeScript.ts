import pema from "pema";
import string from "pema/string";
import response from "primate/response";
import Status from "primate/response/Status";
import route from "primate/route";

const Cookie = pema({
  session: string.uuid().optional(),
});

route.get(request => {
  const { session } = request.cookies.parse(Cookie);

  return response.text(session ? "OK" : "No session", {
    status: session ? Status.OK : Status.FORBIDDEN,
  });
});
