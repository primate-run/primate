import response from "primate/response";
import route from "primate/route";

export default route({
  get(request) {
    return request.query.has("top-level")
      ? response.view("RouteClient/TopLevel/Form.marko", {
        result: JSON.stringify({ foo: "bar" }),
      })
      : response.view("RouteClient/Form.marko");
  },
  post: route.with({
    contentType: "application/x-www-form-urlencoded",
  }, async request => {
    const form = await request.body.form();
    return { foo: form.foo };
  }),
});
