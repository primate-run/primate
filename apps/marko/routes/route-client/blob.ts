import response from "primate/response";
import route from "primate/route";

export default route({
  get(request) {
    return request.query.has("top-level")
      ? response.view("RouteClient/TopLevel/Blob.marko", { result: "hello" })
      : response.view("RouteClient/Blob.marko");
  },
  post: route.with({ contentType: "application/octet-stream" }, request => {
    return request.body.blob();
  }),
});
