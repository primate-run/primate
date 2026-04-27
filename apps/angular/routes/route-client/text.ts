import response from "primate/response";
import route from "primate/route";

export default route({
  get(request) {
    const toplevel = request.query.has("top-level") ? "TopLevel/" : "";
    return response.view(`RouteClient/${toplevel}Text.component.ts`);
  },
  post: route.with({ contentType: "text/plain" }, request => {
    return request.body.text();
  }),
});
