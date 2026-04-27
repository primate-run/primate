import response from "primate/response";
import route from "primate/route";

export default route({
  get(request) {
    const toplevel = request.query.has("top-level") ? "TopLevel/" : "";
    return response.view(`RouteClient/${toplevel}JSON.vue`);
  },
  post: route.with({ contentType: "application/json" }, request => {
    return request.body.json() as any;
  }),
});
