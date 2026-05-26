import response from "primate/response";
import route from "primate/route";

export default route({
  get(request) {
    return request.query.has("top-level")
      ? response.view("RouteClient/TopLevel/JSON.marko", {
        result: JSON.stringify({ foo: "bar" }),
      })
      : response.view("RouteClient/JSON.marko");
  },
  post: route.with({ contentType: "application/json" }, async request => {
    return request.body.json() as any;
  }),
});
