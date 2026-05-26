import response from "primate/response";
import route from "primate/route";

export default route({
  get(request) {
    return request.query.has("top-level")
      ? response.view("RouteClient/TopLevel/Text.marko", { result: "hello" })
      : response.view("RouteClient/Text.marko");
  },
  post: route.with({ contentType: "text/plain" }, async request => {
    return request.body.text();
  }),
});
