import View from "#view/RouteClient/Form";
import TopLevel from "#view/RouteClient/TopLevel/Form";
import response from "primate/response";
import route from "primate/route";

export default route({
  get(request) {
    return response.view(request.query.has("top-level") ? TopLevel : View);
  },
  post: route.with({
    contentType: "application/x-www-form-urlencoded",
  }, async request => {
    const form = await request.body.form();
    return { foo: form.foo };
  }),
});
