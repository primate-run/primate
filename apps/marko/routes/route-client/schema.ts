import p from "pema";
import response from "primate/response";
import route from "primate/route";

export default route({
  get(request) {
    return request.query.has("top-level")
      ? response.view("RouteClient/TopLevel/Schema.marko", {
        result: JSON.stringify({ foo: "bar" }),
      })
      : response.view("RouteClient/Schema.marko");
  },
  post: route.with({
    contentType: "application/json",
    body: p({ foo: p.string }),
  }, async request => {
    const { foo } = await request.body.json();
    return { foo };
  }),
});
