import View from "@/views/RouteClient/OptionalRestPath";
import p from "pema";
import response from "primate/response";
import route from "primate/route";

const PathSchema = p({
  name: p.string,
});

export default route({
  get: route.with({ path: PathSchema }, request => {
    return response.view(View, { name: request.path.get("name") });
  }),
  post: route.with({ path: PathSchema }, request => {
    return { name: request.path.get("name") };
  }),
});
