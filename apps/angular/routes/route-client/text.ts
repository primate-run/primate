import View from "@/views/RouteClient/Text";
import TopLevel from "@/views/RouteClient/TopLevel/Text";
import response from "primate/response";
import route from "primate/route";

export default route({
  get(request) {
    return response.view(request.query.has("top-level") ? TopLevel : View);
  },
  post: route.with({ contentType: "text/plain" }, request => {
    return request.body.text();
  }),
});
