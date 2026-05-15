import FormLevel from "#view/RouteClient/FormLevel";
import p from "pema";
import response from "primate/response";
import route from "primate/route";

export default route({
  get() {
    return response.view(FormLevel);
  },
  post: route.with({
    contentType: "application/x-www-form-urlencoded",
  }, async request => {
    const form = await request.body.form();
    p.literal("valid").parse(form.foo);
    return { foo: form.foo };
  }),
});
