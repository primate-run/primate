import http from "@rcompat/http";
import p from "pema";
import response from "primate/response";
import route from "primate/route";

const CookieSchema = p({
  session: p.uuid.optional(),
});

export default route({
  get(request) {
    const { session } = CookieSchema.parse(request.cookies);

    return response.text(session ? "OK" : "No session", {
      status: session ? http.Status.OK : http.Status.FORBIDDEN,
    });
  },
});
