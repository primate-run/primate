import p from "pema";
import response from "primate/response";
import route from "primate/route";

export default route({
  get() {
    return response.view("RouteClient/Action.component.ts");
  },
  post: route.with({
    contentType: "application/x-www-form-urlencoded",
    body: p({ foo: p.string.min(5) }),
  }, async request => {
    const { foo } = await request.body.form();
    return { foo };
  }),
});
