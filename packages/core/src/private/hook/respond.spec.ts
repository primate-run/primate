import respond from "#hook/respond";
import { html } from "@rcompat/http/mime";
import Status from "@rcompat/http/Status";
import test from "@rcompat/test";

const app = {
  respond(body: any, { status = Status.OK, headers = {} } = {}) {
    return new Response(body, {
      status,
      headers: {
        "content-type": html, ...headers,
      },
    });
  },
};

const url = "https://primate.run";
const status = Status.FOUND;

test.case("guess URL", async assert => {
  const response = await (respond(new URL(url)) as any)(app)!;
  // assert(await response.text()).null();
  assert(response.status).equals(status);
  assert(response.headers.get("location")).equals(url);
});
