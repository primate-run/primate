import response from "primate/response";
import route from "primate/route";

export default route({
  get(request) {
    const toplevel = request.query.has("top-level") ? "TopLevel/" : "";
    return response.view(`RouteClient/${toplevel}Blob.component.ts`);
  },
  post: route.with({ contentType: "application/octet-stream" }, request => {
    return request.body.blob();
  }),
});
