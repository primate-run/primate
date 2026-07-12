import p from "pema";
import route from "primate/route";

const Body = p({
  name: p.string,
}).derive(({ name }) => name.toUpperCase());

export default route({
  post: route.with({ body: Body, contentType: "application/json" }, async request => {
    return await request.body.json();
  }),
});
