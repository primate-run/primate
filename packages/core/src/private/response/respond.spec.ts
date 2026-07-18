import { Code } from "#errors";
import respond from "#response/respond";
import test from "@rcompat/test";

const url = "https://primate.run/";

test.case("implicit URL redirects are disabled", assert => {
  assert(() => respond(new URL(url) as never)).throws(Code.response_implicit_url);
});
