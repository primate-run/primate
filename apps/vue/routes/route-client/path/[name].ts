import p from "pema";
import response from "primate/response";
import route from "primate/route";

export default route({
  get() {
    return response.view("RouteClient/Path.vue");
  },
  post: route.with({
    path: p({ name: p.string }),
  }, request => {
    const { name } = request.path.toJSON();
    return { name };
  }),
});
