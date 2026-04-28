import p from "pema";
import http from "@rcompat/http";
import response from "primate/response";
import route from "primate/route";

const CookieSchema = p({
  session: p.uuid.optional(),
});

export default route({
  get(request) {
    const { session } = request.cookies.parse(CookieSchema);

    return response.text(session ? "OK" : "No session", {
      status: session ? http.Status.OK : http.Status.FORBIDDEN,
    });
  },
});
