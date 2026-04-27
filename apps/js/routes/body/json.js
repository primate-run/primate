import route from "primate/route";

export default route({
  post: route.with({ contentType: "application/json" }, async request => {
    return JSON.stringify(await request.body.json());
  }),
});
