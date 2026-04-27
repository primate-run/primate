import p from "pema";
import response from "primate/response";
import route from "primate/route";

export default route({
  get(request) {
    const toplevel = request.query.has("top-level") ? "TopLevel/" : "";
    return response.view(`RouteClient/${toplevel}Schema.component.ts`);
  },
  post: route.with({
    contentType: "application/json",
    body: p({ foo: p.string }),
  }, async request => {
    const { foo } = await request.body.json();
    return { foo };
  }),
});
