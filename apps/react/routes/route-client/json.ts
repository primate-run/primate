import View from "@/views/RouteClient/JSON";
import TopLevel from "@/views/RouteClient/TopLevel/JSON";
import response from "primate/response";
import route from "primate/route";

export default route({
  get(request) {
    return response.view(request.query.has("top-level") ? TopLevel : View);
  },
  post: route.with({ contentType: "application/json" }, async request => {
    return request.body.json() as any;
  }),
});
