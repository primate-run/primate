import pema from "pema";
import string from "pema/string";
import Status from "primate/response/Status";
import text from "primate/response/text";
import route from "primate/route";

const CookieSchema = pema({
  session: string.uuid().optional(),
});

route.get(request => {
  const { session } = request.cookies.as(CookieSchema);

  return text(session ? "OK" : "No session", {
    status: session ? Status.OK : Status.FORBIDDEN,
  });
});
