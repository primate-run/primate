import to_response from "#to-response";
import test from "@rcompat/test";

const app = {
  respond(body: BodyInit | null, init?: ResponseInit) {
    return new Response(body, init);
  },
};
const request = { url: new URL("https://app.example/") };

function redirect(location: string, status?: number) {
  return to_response({ __PRMT__: "redirect", location, status } as any) as any;
}

test.case("python redirects use core local validation", assert => {
  const response = redirect("/safe", 303)(app, {}, request);
  assert(response.status).equals(303);
  assert(response.headers.get("Location")).equals("/safe");
  assert(() => redirect("//evil.example")).throws(Error);
  assert(() => redirect("/safe", 300)).throws(Error);
});
