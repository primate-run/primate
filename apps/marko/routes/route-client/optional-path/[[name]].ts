import p from "pema";
import response from "primate/response";
import route from "primate/route";

const PathSchema = p({
  name: p.string,
});

export default route({
  get: route.with({ path: PathSchema }, request => {
    const name = request.path.get("name");
    return response.view("RouteClient/OptionalPath.marko", { name });
  }),
  post: route.with({ path: PathSchema }, request => {
    return { name: request.path.get("name") };
  }),
});
