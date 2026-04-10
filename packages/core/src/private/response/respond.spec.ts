import respond from "#response/respond";
import http from "@rcompat/http";
import test from "@rcompat/test";

const app = {
  respond(body: any, { headers = {}, status = http.Status.OK } = {}) {
    return new Response(body, {
      headers: {
        "content-type": http.MIME.TEXT_HTML, ...headers,
      },
      status,
    });
  },
};

const url = "https://primate.run/";

test.case("guess URL", async assert => {
  const response = await (respond(new URL(url)) as any)(app)!;
  // assert(await response.text()).null();
  assert(response.status).equals(http.Status.FOUND);
  assert(response.headers.get("location")).equals(url);
});
