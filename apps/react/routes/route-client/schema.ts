import View from "#view/RouteClient/Schema";
import TopLevel from "#view/RouteClient/TopLevel/Schema";
import p from "pema";
import response from "primate/response";
import route from "primate/route";

export default route({
  get(request) {
    return response.view(request.query.has("top-level") ? TopLevel : View);
  },
  post: route.with({
    contentType: "application/json",
    body: p({ foo: p.string }),
  }, async request => {
    const { foo } = await request.body.json();
    return { foo };
  }),
});
