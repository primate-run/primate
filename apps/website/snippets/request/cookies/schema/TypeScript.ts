import p from "pema";
import Status from "primate/http/Status";
import response from "primate/response";
import route from "primate/route";

const CookieSchema = p({
  session: p.string.uuid().optional(),
});

route.get(request => {
  const { session } = request.cookies.parse(CookieSchema);

  return response.text(session ? "OK" : "No session", {
    status: session ? Status.OK : Status.FORBIDDEN,
  });
});
