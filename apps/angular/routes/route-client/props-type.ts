import View from "#view/RouteClient/PropsType";
import p from "pema";
import response from "primate/response";
import route from "primate/route";

export default route({
  get: route.with({
    responses: {
      view: p({
        message: p.string,
        foo: p.string.optional(),
      }),
    },
  }, () => {
    return response.view(View, { message: "angular" });
  }),
});
