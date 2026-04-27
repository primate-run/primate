import response from "primate/response";
import route from "primate/route";

export default route({
  get(request) {
    const toplevel = request.query.has("top-level") ? "TopLevel/" : "";
    return response.view(`RouteClient/${toplevel}Form.vue`);
  },
  post: route.with({
    contentType: "application/x-www-form-urlencoded",
  }, async request => {
    const form = await request.body.form();
    return { foo: form.foo };
  }),
});
