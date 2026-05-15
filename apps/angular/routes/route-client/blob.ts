import View from "#view/RouteClient/Blob";
import TopLevel from "#view/RouteClient/TopLevel/Blob";
import response from "primate/response";
import route from "primate/route";

export default route({
  get(request) {
    return response.view(request.query.has("top-level") ? TopLevel : View);
  },
  post: route.with({ contentType: "application/octet-stream" }, request => {
    return request.body.blob();
  }),
});
