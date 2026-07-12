import p from "pema";
import route from "primate/route";

const Body = p.async({
  name: p.string,
}).derive(async ({ name }) => name.toUpperCase());

export default route({
  post: route.with({ body: Body, contentType: "application/json" }, async request => {
    return await request.body.json() as string;
  }),
});
