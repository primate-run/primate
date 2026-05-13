import View from "#view/RouteClient/PathAction";
import p from "pema";
import response from "primate/response";
import route from "primate/route";

export default route({
  get(request) {
    return response.view(View, { name: request.path.get("name") });
  },
  post: route.with({
    contentType: "application/x-www-form-urlencoded",
    path: p({ name: p.loose.number }),
    body: p({ foo: p.string.min(5) }),
  }, async request => {
    const name = request.path.get("name");
    const { foo } = await request.body.form();
    return { name, foo };
  }),
});
